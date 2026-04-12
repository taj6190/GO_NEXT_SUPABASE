package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/gonext-ecommerce/backend/internal/config"
	"github.com/gonext-ecommerce/backend/internal/handler"
	"github.com/gonext-ecommerce/backend/internal/middleware"
	"github.com/gonext-ecommerce/backend/internal/repository"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Database connection
	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("✅ Connected to PostgreSQL (Supabase)")

	// Run migrations
	runMigrations(dbPool, ctx)

	// Redis connection (optional)
	var rdb *redis.Client
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err == nil {
		rdb = redis.NewClient(opt)
		if err := rdb.Ping(ctx).Err(); err != nil {
			log.Printf("⚠️  Redis not available: %v (caching disabled)", err)
			rdb = nil
		} else {
			log.Println("✅ Connected to Redis")
			defer rdb.Close()
		}
	}

	// Seed admin user
	seedAdmin(dbPool, ctx, cfg)

	// Repositories
	userRepo := repository.NewUserRepository(dbPool)
	productRepo := repository.NewProductRepository(dbPool)
	categoryRepo := repository.NewCategoryRepository(dbPool)
	cartRepo := repository.NewCartRepository(dbPool)
	orderRepo := repository.NewOrderRepository(dbPool)
	paymentRepo := repository.NewPaymentRepository(dbPool)
	couponRepo := repository.NewCouponRepository(dbPool)
	wishlistRepo := repository.NewWishlistRepository(dbPool)
	addressRepo := repository.NewAddressRepository(dbPool)
	reviewRepo := repository.NewReviewRepository(dbPool)

	// Services
	authService := service.NewAuthService(userRepo, cfg)
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo, rdb)
	categoryService := service.NewCategoryService(categoryRepo, rdb)
	cartService := service.NewCartService(cartRepo, productRepo)
	orderService := service.NewOrderService(orderRepo, cartRepo, productRepo, couponRepo, paymentRepo, addressRepo, rdb)
	paymentService := service.NewPaymentService(paymentRepo, orderRepo)
	couponService := service.NewCouponService(couponRepo, rdb)
	wishlistService := service.NewWishlistService(wishlistRepo)
	addressService := service.NewAddressService(addressRepo)
	uploadService := service.NewUploadService(cfg)
	reviewService := service.NewReviewService(reviewRepo, productRepo, rdb)

	// Handlers
	authHandler := handler.NewAuthHandler(authService, cartService)
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	cartHandler := handler.NewCartHandler(cartService)
	orderHandler := handler.NewOrderHandler(orderService)
	paymentHandler := handler.NewPaymentHandler(paymentService)
	couponHandler := handler.NewCouponHandler(couponService)
	wishlistHandler := handler.NewWishlistHandler(wishlistService)
	addressHandler := handler.NewAddressHandler(addressService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	reviewHandler := handler.NewReviewHandler(reviewService)

	// Router
	gin.SetMode(cfg.GinMode)
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))
	r.Use(middleware.RateLimitMiddleware(1000, time.Minute))

	// Health check endpoint with Redis status
	r.GET("/health", func(c *gin.Context) {
		redisStatus := "unavailable"
		if rdb != nil {
			if err := rdb.Ping(context.Background()).Err(); err == nil {
				redisStatus = "ok"
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
			"redis":  redisStatus,
		})
	})

	api := r.Group("/api/v1")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.RefreshToken)
		auth.GET("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.GetMe)
	}

	// Public product routes
	products := api.Group("/products")
	{
		products.GET("", productHandler.List)
		products.GET("/featured", productHandler.GetFeatured)
		products.GET("/search", productHandler.Search)
		products.GET("/:slug", productHandler.GetBySlug)
		products.GET("/:slug/related", productHandler.GetRelated)
	}

	// Public category routes
	categories := api.Group("/categories")
	{
		categories.GET("", categoryHandler.GetTree)
		categories.GET("/:slug", categoryHandler.GetBySlug)
	}

	// Review routes
	reviews := api.Group("/reviews")
	{
		reviews.GET("/product/:productId", reviewHandler.ListByProduct)
		reviews.GET("/product/:productId/summary", reviewHandler.GetSummary)
		reviews.POST("", middleware.AuthMiddleware(cfg.JWTSecret), reviewHandler.Create)
	}

	// Cart routes (works for both guest and logged-in)
	cart := api.Group("/cart")
	cart.Use(middleware.OptionalAuth(cfg.JWTSecret), middleware.GuestSession())
	{
		cart.GET("", cartHandler.GetCart)
		cart.POST("/items", cartHandler.AddItem)
		cart.PUT("/items/:id", cartHandler.UpdateItem)
		cart.DELETE("/items/:id", cartHandler.RemoveItem)
		cart.DELETE("", cartHandler.ClearCart)
		cart.POST("/merge", middleware.AuthMiddleware(cfg.JWTSecret), cartHandler.MergeCart)
	}

	// Order routes
	orders := api.Group("/orders")
	orders.Use(middleware.OptionalAuth(cfg.JWTSecret), middleware.GuestSession())
	{
		orders.POST("", orderHandler.CreateOrder)
		orders.GET("/track/:orderNumber", orderHandler.TrackOrder)
	}
	ordersAuth := api.Group("/orders")
	ordersAuth.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		ordersAuth.GET("", orderHandler.GetUserOrders)
		ordersAuth.GET("/:id", orderHandler.GetOrder)
	}

	// Payment routes
	payments := api.Group("/payments")
	{
		payments.POST("/initiate", middleware.OptionalAuth(cfg.JWTSecret), middleware.GuestSession(), paymentHandler.InitiatePayment)
		payments.GET("/bkash/callback", paymentHandler.BkashCallback)
		payments.GET("/nagad/callback", paymentHandler.NagadCallback)
		payments.GET("/:orderId", middleware.AuthMiddleware(cfg.JWTSecret), paymentHandler.GetPaymentStatus)
	}

	// Coupon routes
	coupons := api.Group("/coupons")
	{
		coupons.POST("/validate", middleware.OptionalAuth(cfg.JWTSecret), middleware.GuestSession(), couponHandler.Validate)
	}

	// Wishlist routes (auth required)
	wishlist := api.Group("/wishlist")
	wishlist.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		wishlist.GET("", wishlistHandler.GetWishlist)
		wishlist.POST("/items", wishlistHandler.AddItem)
		wishlist.DELETE("/items/:productId", wishlistHandler.RemoveItem)
	}

	// Address routes
	addresses := api.Group("/addresses")
	addresses.Use(middleware.OptionalAuth(cfg.JWTSecret), middleware.GuestSession())
	{
		addresses.POST("", addressHandler.Create)
	}
	addressesAuth := api.Group("/addresses")
	addressesAuth.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		addressesAuth.GET("", addressHandler.GetUserAddresses)
		addressesAuth.PUT("/:id", addressHandler.Update)
		addressesAuth.DELETE("/:id", addressHandler.Delete)
		addressesAuth.PUT("/:id/default", addressHandler.SetDefault)
	}

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminMiddleware())
	{
		admin.GET("/dashboard", orderHandler.GetDashboard)

		// Products
		admin.GET("/products", productHandler.AdminList)
		admin.GET("/products/:id", productHandler.GetByID)
		admin.POST("/products", productHandler.Create)
		admin.PUT("/products/:id", productHandler.Update)
		admin.DELETE("/products/:id", productHandler.Delete)

		// Categories
		admin.GET("/categories", categoryHandler.List)
		admin.POST("/categories", categoryHandler.Create)
		admin.PUT("/categories/:id", categoryHandler.Update)
		admin.DELETE("/categories/:id", categoryHandler.Delete)

		// Orders
		admin.GET("/orders", orderHandler.AdminListOrders)
		admin.GET("/orders/:id", orderHandler.GetOrder)
		admin.PUT("/orders/:id/status", orderHandler.AdminUpdateStatus)

		// Users
		admin.GET("/users", userHandler.ListUsers)
		admin.PUT("/users/:id", userHandler.AdminUpdateUser)

		// Coupons
		admin.GET("/coupons", couponHandler.List)
		admin.POST("/coupons", couponHandler.Create)
		admin.PUT("/coupons/:id", couponHandler.Update)
		admin.DELETE("/coupons/:id", couponHandler.Delete)

		// Payments
		admin.GET("/payments", paymentHandler.ListPayments)

		// Reviews (admin can delete)
		admin.DELETE("/reviews/:id", reviewHandler.Delete)

		// Upload
		admin.POST("/upload", uploadHandler.UploadImage)
	}

	// Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("🚀 Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}

func runMigrations(pool *pgxpool.Pool, ctx context.Context) {
	migrations := []string{
		"migrations/001_create_users.sql",
		"migrations/002_create_categories.sql",
		"migrations/003_create_products.sql",
		"migrations/004_create_product_images.sql",
		"migrations/005_create_addresses.sql",
		"migrations/006_create_coupons.sql",
		"migrations/007_create_cart_items.sql",
		"migrations/008_create_wishlists.sql",
		"migrations/009_create_orders.sql",
		"migrations/010_create_payments.sql",
		"migrations/011_create_product_variants.sql",
		"migrations/012_create_reviews.sql",
		"migrations/013_rename_compare_price.sql",
	}

	for _, m := range migrations {
		data, err := os.ReadFile(m)
		if err != nil {
			log.Printf("⚠️  Migration file not found: %s", m)
			continue
		}
		_, err = pool.Exec(ctx, string(data))
		if err != nil {
			log.Printf("⚠️  Migration %s: %v", m, err)
		} else {
			log.Printf("✅ Migration applied: %s", m)
		}
	}
}

func seedAdmin(pool *pgxpool.Pool, ctx context.Context, cfg *config.Config) {
	var count int64
	err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'admin'`).Scan(&count)
	if err != nil || count > 0 {
		return
	}

	hash, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("⚠️  Failed to hash admin password: %v", err)
		return
	}

	_, err = pool.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES (gen_random_uuid(), $1, $2, 'Admin', 'admin', true)`,
		cfg.AdminEmail, hash,
	)
	if err != nil {
		log.Printf("⚠️  Failed to seed admin: %v", err)
	} else {
		log.Printf("✅ Admin user seeded: %s", cfg.AdminEmail)
	}

	_ = fmt.Sprintf // ensure import
}
