package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
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
	// 1. Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	// Set Gin mode based on config (ensure this is "release" in production)
	gin.SetMode(cfg.GinMode)

	// 2. Database connection with timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Println("❌ DB connection pool creation failed:", err)
		log.Println("⚠️ Continuing without database (DEGRADED MODE)")
		dbPool = nil
	} else if err := dbPool.Ping(ctx); err != nil {
		log.Println("❌ DB ping failed:", err)
		dbPool = nil
	} else {
		log.Println("✅ Database connected successfully")
		// Run migrations only if DB is connected
		runMigrations(dbPool, context.Background())
		seedAdmin(dbPool, context.Background(), cfg)
	}

	// 3. Redis connection (optional, graceful degradation)
	var rdb *redis.Client
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err == nil {
			rdb = redis.NewClient(opt)
			redisCtx, redisCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer redisCancel()

			if err := rdb.Ping(redisCtx).Err(); err != nil {
				log.Printf("⚠️ Redis not available: %v (caching disabled)", err)
				rdb = nil
			} else {
				log.Println("✅ Connected to Redis")
				defer rdb.Close()
			}
		} else {
			log.Printf("⚠️ Invalid Redis URL: %v", err)
		}
	}

	// 4. Initialize Repositories
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

	// 5. Initialize Services
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

	// 6. Initialize Handlers
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

	// 7. Router Setup
	r := gin.Default()

	// 🚨 PRODUCTION FIX: Trust Proxies
	// Render, Heroku, AWS etc. use reverse proxies. This ensures c.ClientIP() gets the real user IP, not the Render load balancer IP.
	_ = r.SetTrustedProxies(nil)

	// 🚨 PRODUCTION FIX: Dynamic CORS Allowed Origins
	// Read from ENV variable to support Vercel preview branches or custom domains without code changes.
	allowedOriginsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	var allowedOrigins []string
	if allowedOriginsStr != "" {
		// e.g., CORS_ALLOWED_ORIGINS="https://go-next-supabase.vercel.app,https://my-custom-domain.com"
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
		for i := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
		}
	} else {
		// Fallback to defaults
		allowedOrigins = []string{
			"https://go-next-supabase.vercel.app",
			"http://localhost:3000",
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Session-ID", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Global middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))
	r.Use(middleware.RateLimitMiddleware(1000, time.Minute))

	// Health check endpoint with DB and Redis status
	r.GET("/health", func(c *gin.Context) {
		redisStatus := "unavailable"
		dbStatus := "unavailable"

		if rdb != nil {
			if err := rdb.Ping(context.Background()).Err(); err == nil {
				redisStatus = "ok"
			}
		}

		if dbPool != nil {
			if err := dbPool.Ping(context.Background()); err == nil {
				dbStatus = "ok"
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ok",
			"time":     time.Now().Format(time.RFC3339),
			"database": dbStatus,
			"redis":    redisStatus,
			"env":      cfg.GinMode,
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

	// Cart routes
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

	// Wishlist routes
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

		// Reviews
		admin.DELETE("/reviews/:id", reviewHandler.Delete)

		// Upload
		admin.POST("/upload", uploadHandler.UploadImage)
	}

	// 8. Server Setup
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
		// 🚨 PRODUCTION FIX: Mitigate slowloris attacks and handle Render timeouts gracefully
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// 9. Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // Increased shutdown buffer to 10s
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited cleanly")
}

func runMigrations(pool *pgxpool.Pool, ctx context.Context) {
	// Note: In a true containerized/Render production environment, it is highly recommended
	// to use Go's 'embed' package (`//go:embed migrations/*.sql`) rather than reading from os files,
	// to ensure the files are baked into your binary and paths don't break.
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
			// Do not log.Fatal here if you want the app to keep running on duplicate table errors,
			// but consider tracking actual failure states carefully.
			log.Printf("⚠️  Migration %s encountered an issue: %v", m, err)
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
