package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/shopspring/decimal"
)

type OrderService struct {
	orderRepo   domain.OrderRepository
	cartRepo    domain.CartRepository
	productRepo domain.ProductRepository
	couponRepo  domain.CouponRepository
	paymentRepo domain.PaymentRepository
	addressRepo domain.AddressRepository
	cache       *utils.CacheManager
}

func NewOrderService(
	orderRepo domain.OrderRepository,
	cartRepo domain.CartRepository,
	productRepo domain.ProductRepository,
	couponRepo domain.CouponRepository,
	paymentRepo domain.PaymentRepository,
	addressRepo domain.AddressRepository,
	rdb *redis.Client,
) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		cartRepo:    cartRepo,
		productRepo: productRepo,
		couponRepo:  couponRepo,
		paymentRepo: paymentRepo,
		addressRepo: addressRepo,
		cache:       utils.NewCacheManager(rdb),
	}
}

func effectiveOrderUnitPrice(price, discountPrice decimal.Decimal) decimal.Decimal {
	if discountPrice.GreaterThan(decimal.Zero) && discountPrice.LessThan(price) {
		return discountPrice
	}
	return price
}

func variantOptionsLabel(v *domain.Variant) string {
	if v == nil || len(v.Options) == 0 {
		return ""
	}
	parts := make([]string, 0, len(v.Options))
	for _, o := range v.Options {
		switch {
		case o.GroupName != "" && o.ValueName != "":
			parts = append(parts, o.GroupName+": "+o.ValueName)
		case o.ValueName != "":
			parts = append(parts, o.ValueName)
		}
	}
	return strings.Join(parts, ", ")
}

func primaryVariantImage(v *domain.Variant) string {
	if v == nil || len(v.Images) == 0 {
		return ""
	}
	for _, im := range v.Images {
		if im.IsPrimary {
			return im.ImageURL
		}
	}
	return v.Images[0].ImageURL
}

func primaryProductImage(p *domain.Product) string {
	if p == nil || len(p.Images) == 0 {
		return ""
	}
	for _, im := range p.Images {
		if im.IsPrimary {
			return im.ImageURL
		}
	}
	return p.Images[0].ImageURL
}

func (s *OrderService) CreateOrder(ctx context.Context, userID *uuid.UUID, sessionID string, input domain.CreateOrderInput) (*domain.Order, error) {
	var cartItems []domain.CartItem
	var err error

	// Handle quick buy
	if input.QuickBuyProductID != nil {
		product, err := s.productRepo.GetByID(ctx, *input.QuickBuyProductID)
		if err != nil {
			return nil, fmt.Errorf("product not found")
		}
		qty := input.QuickBuyQuantity
		if qty < 1 {
			qty = 1
		}
		if product.StockQuantity < qty {
			return nil, fmt.Errorf("insufficient stock")
		}
		cartItems = []domain.CartItem{
			{
				ProductID: product.ID,
				Quantity:  qty,
				Product:   product,
			},
		}
	} else {
		// Get cart items
		if userID != nil {
			cartItems, err = s.cartRepo.GetUserCart(ctx, *userID)
		} else if sessionID != "" {
			cartItems, err = s.cartRepo.GetSessionCart(ctx, sessionID)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get cart: %w", err)
		}
	}

	if len(cartItems) == 0 {
		return nil, fmt.Errorf("cart is empty")
	}

	// Calculate subtotal
	subtotal := decimal.NewFromInt(0)
	var orderItems []domain.OrderItem
	for _, ci := range cartItems {
		if ci.Product == nil {
			continue
		}
		v := ci.Variant
		if ci.VariantID != nil && v == nil {
			lv, err := s.productRepo.GetVariantByID(ctx, *ci.VariantID)
			if err != nil || lv == nil {
				return nil, fmt.Errorf("variant not found for %s", ci.Product.Name)
			}
			v = lv
		}
		if v != nil {
			if v.StockQuantity < ci.Quantity {
				return nil, fmt.Errorf("insufficient stock for %s", ci.Product.Name)
			}
		} else if ci.Product.StockQuantity < ci.Quantity {
			return nil, fmt.Errorf("insufficient stock for %s", ci.Product.Name)
		}
		var unitPrice decimal.Decimal
		if v != nil {
			unitPrice = effectiveOrderUnitPrice(v.Price, v.DiscountPrice)
		} else {
			unitPrice = effectiveOrderUnitPrice(ci.Product.Price, ci.Product.DiscountPrice)
		}
		itemTotal := unitPrice.Mul(decimal.NewFromInt(int64(ci.Quantity)))
		img := primaryVariantImage(v)
		if img == "" {
			img = primaryProductImage(ci.Product)
		}
		orderItems = append(orderItems, domain.OrderItem{
			ProductID:      ci.ProductID,
			VariantID:      ci.VariantID,
			ProductName:    ci.Product.Name,
			ProductSlug:    ci.Product.Slug,
			ImageURL:       img,
			VariantOptions: variantOptionsLabel(v),
			UnitPrice:      unitPrice,
			Quantity:       ci.Quantity,
			TotalPrice:     itemTotal,
		})
		subtotal = subtotal.Add(itemTotal)
	}

	// Apply coupon
	discountAmount := decimal.NewFromInt(0)
	var couponID *uuid.UUID
	if input.CouponCode != "" {
		coupon, _ := s.couponRepo.GetByCode(ctx, input.CouponCode)
		if coupon != nil && coupon.IsActive && time.Now().After(coupon.ValidFrom) && time.Now().Before(coupon.ValidTo) {
			if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
				return nil, fmt.Errorf("coupon usage limit reached")
			}
			if subtotal.LessThan(coupon.MinOrderAmount) {
				return nil, fmt.Errorf("minimum order amount not met for this coupon")
			}
			if coupon.Type == domain.CouponTypePercentage {
				discountAmount = subtotal.Mul(coupon.Value).Div(decimal.NewFromInt(100))
				if coupon.MaxDiscount.GreaterThan(decimal.Zero) && discountAmount.GreaterThan(coupon.MaxDiscount) {
					discountAmount = coupon.MaxDiscount
				}
			} else {
				discountAmount = coupon.Value
			}
			couponID = &coupon.ID
		}
	}

	shippingCost := decimal.NewFromInt(0) // Free shipping for now
	total := subtotal.Sub(discountAmount).Add(shippingCost)

	order := &domain.Order{
		UserID:            userID,
		GuestEmail:        input.GuestEmail,
		GuestPhone:        input.GuestPhone,
		OrderNumber:       utils.GenerateOrderNumber(),
		Status:            domain.OrderStatusPending,
		Subtotal:          subtotal,
		DiscountAmount:    discountAmount,
		ShippingCost:      shippingCost,
		Total:             total,
		CouponID:          couponID,
		ShippingAddressID: input.ShippingAddressID,
		Notes:             input.Notes,
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Set order ID on items
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
	}
	if err := s.orderRepo.CreateItems(ctx, orderItems); err != nil {
		return nil, fmt.Errorf("failed to create order items: %w", err)
	}

	// Decrease stock (variant lines decrement variant stock; simple SKUs decrement product stock)
	for _, ci := range cartItems {
		if ci.VariantID != nil {
			_ = s.productRepo.UpdateVariantStock(ctx, *ci.VariantID, -ci.Quantity)
		} else {
			_ = s.productRepo.UpdateStock(ctx, ci.ProductID, -ci.Quantity)
		}
	}

	// Increment coupon usage
	if couponID != nil {
		_ = s.couponRepo.IncrementUsage(ctx, *couponID)
	}

	// Create payment record
	payment := &domain.Payment{
		OrderID:         order.ID,
		Method:          domain.PaymentMethod(input.PaymentMethod),
		Status:          domain.PaymentStatusPending,
		Amount:          total,
		GatewayResponse: domain.JSON("{}"),
	}
	if input.PaymentMethod == "cod" {
		payment.Status = domain.PaymentStatusPending
	}
	_ = s.paymentRepo.Create(ctx, payment)

	// Clear cart (but not for quick buy)
	if input.QuickBuyProductID == nil {
		if userID != nil {
			_ = s.cartRepo.ClearUserCart(ctx, *userID)
		} else if sessionID != "" {
			_ = s.cartRepo.ClearSessionCart(ctx, sessionID)
		}
	}

	order.Items = orderItems
	order.Payment = payment
	return order, nil
}

func (s *OrderService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("order:id:%s", id)
	var cachedOrder domain.Order
	if err := s.cache.Get(ctx, cacheKey, &cachedOrder); err == nil {
		return &cachedOrder, nil
	}

	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	payment, _ := s.paymentRepo.GetByOrderID(ctx, id)
	order.Payment = payment
	addr, _ := s.addressRepo.GetByID(ctx, order.ShippingAddressID)
	order.ShippingAddress = addr

	// Cache for 30 minutes
	_ = s.cache.Set(ctx, cacheKey, order, 30*time.Minute)

	return order, nil
}

func (s *OrderService) GetByOrderNumber(ctx context.Context, orderNumber string) (*domain.Order, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("order:number:%s", orderNumber)
	var cachedOrder domain.Order
	if err := s.cache.Get(ctx, cacheKey, &cachedOrder); err == nil {
		return &cachedOrder, nil
	}

	order, err := s.orderRepo.GetByOrderNumber(ctx, orderNumber)
	if err != nil {
		return nil, err
	}
	payment, _ := s.paymentRepo.GetByOrderID(ctx, order.ID)
	order.Payment = payment

	// Cache for 30 minutes
	_ = s.cache.Set(ctx, cacheKey, order, 30*time.Minute)

	return order, nil
}

func (s *OrderService) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.OrderStatus) error {
	err := s.orderRepo.UpdateStatus(ctx, id, status)
	if err == nil {
		// Invalidate cache
		s.invalidateOrderCache(ctx, id)
	}
	return err
}

func (s *OrderService) GetUserOrders(ctx context.Context, userID uuid.UUID, page, limit int) ([]domain.Order, int64, error) {
	return s.orderRepo.GetUserOrders(ctx, userID, page, limit)
}

func (s *OrderService) ListOrders(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int64, error) {
	return s.orderRepo.List(ctx, filter)
}

func (s *OrderService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	totalOrders, _ := s.orderRepo.Count(ctx)
	pendingOrders, _ := s.orderRepo.CountByStatus(ctx, domain.OrderStatusPending)
	processingOrders, _ := s.orderRepo.CountByStatus(ctx, domain.OrderStatusProcessing)
	deliveredOrders, _ := s.orderRepo.CountByStatus(ctx, domain.OrderStatusDelivered)
	totalRevenue, _ := s.orderRepo.GetTotalRevenue(ctx)
	todayRevenue, _ := s.orderRepo.GetTodayRevenue(ctx)
	revenueByDay, _ := s.orderRepo.GetRevenueByDay(ctx, 30)
	recentOrders, _ := s.orderRepo.GetRecentOrders(ctx, 10)
	totalProducts, _ := s.productRepo.Count(ctx)
	lowStockProducts, _ := s.productRepo.CountLowStock(ctx, 10)

	return map[string]interface{}{
		"total_orders":       totalOrders,
		"pending_orders":     pendingOrders,
		"processing_orders":  processingOrders,
		"delivered_orders":   deliveredOrders,
		"total_revenue":      totalRevenue,
		"today_revenue":      todayRevenue,
		"revenue_by_day":     revenueByDay,
		"recent_orders":      recentOrders,
		"total_products":     totalProducts,
		"low_stock_products": lowStockProducts,
	}, nil
}

func (s *OrderService) invalidateOrderCache(ctx context.Context, orderID uuid.UUID) {
	_ = s.cache.Delete(ctx,
		fmt.Sprintf("order:id:%s", orderID),
	)
}
