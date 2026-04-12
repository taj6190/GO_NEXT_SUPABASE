package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusConfirmed  OrderStatus = "confirmed"
	OrderStatusProcessing OrderStatus = "processing"
	OrderStatusShipped    OrderStatus = "shipped"
	OrderStatusDelivered  OrderStatus = "delivered"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

type Order struct {
	ID                uuid.UUID       `json:"id"`
	UserID            *uuid.UUID      `json:"user_id"`
	GuestEmail        string          `json:"guest_email,omitempty"`
	GuestPhone        string          `json:"guest_phone,omitempty"`
	OrderNumber       string          `json:"order_number"`
	Status            OrderStatus     `json:"status"`
	Subtotal          decimal.Decimal `json:"subtotal"`
	DiscountAmount    decimal.Decimal `json:"discount_amount"`
	ShippingCost      decimal.Decimal `json:"shipping_cost"`
	Total             decimal.Decimal `json:"total"`
	CouponID          *uuid.UUID      `json:"coupon_id,omitempty"`
	ShippingAddressID uuid.UUID       `json:"shipping_address_id"`
	Notes             string          `json:"notes"`
	Items             []OrderItem     `json:"items,omitempty"`
	Payment           *Payment        `json:"payment,omitempty"`
	ShippingAddress   *Address        `json:"shipping_address,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type OrderItem struct {
	ID             uuid.UUID       `json:"id"`
	OrderID        uuid.UUID       `json:"order_id"`
	ProductID      uuid.UUID       `json:"product_id"`
	VariantID      *uuid.UUID      `json:"variant_id,omitempty"`
	ProductName    string          `json:"product_name"`
	ProductSlug    string          `json:"product_slug,omitempty"`
	ImageURL       string          `json:"image_url,omitempty"`
	VariantOptions string          `json:"variant_options,omitempty"`
	UnitPrice      decimal.Decimal `json:"unit_price"`
	Quantity       int             `json:"quantity"`
	TotalPrice     decimal.Decimal `json:"total_price"`
}

type CreateOrderInput struct {
	GuestEmail        string    `json:"guest_email"`
	GuestPhone        string    `json:"guest_phone"`
	ShippingAddressID uuid.UUID `json:"shipping_address_id"`
	CouponCode        string    `json:"coupon_code"`
	PaymentMethod     string    `json:"payment_method" binding:"required"`
	Notes             string    `json:"notes"`
	// For quick buy
	QuickBuyProductID *uuid.UUID `json:"quick_buy_product_id"`
	QuickBuyQuantity  int        `json:"quick_buy_quantity"`
}

type OrderFilter struct {
	UserID  *uuid.UUID
	Status  *OrderStatus
	Search  string
	Page    int
	Limit   int
	SortBy  string
	SortDir string
}

type OrderRepository interface {
	Create(ctx context.Context, order *Order) error
	GetByID(ctx context.Context, id uuid.UUID) (*Order, error)
	GetByOrderNumber(ctx context.Context, orderNumber string) (*Order, error)
	Update(ctx context.Context, order *Order) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status OrderStatus) error
	List(ctx context.Context, filter OrderFilter) ([]Order, int64, error)
	GetUserOrders(ctx context.Context, userID uuid.UUID, page, limit int) ([]Order, int64, error)

	// Items
	CreateItems(ctx context.Context, items []OrderItem) error
	GetItems(ctx context.Context, orderID uuid.UUID) ([]OrderItem, error)

	// Stats
	Count(ctx context.Context) (int64, error)
	CountByStatus(ctx context.Context, status OrderStatus) (int64, error)
	GetTotalRevenue(ctx context.Context) (decimal.Decimal, error)
	GetTodayRevenue(ctx context.Context) (decimal.Decimal, error)
	GetRevenueByDay(ctx context.Context, days int) ([]RevenueStat, error)
	GetRecentOrders(ctx context.Context, limit int) ([]Order, error)
}

type RevenueStat struct {
	Date    string          `json:"date"`
	Revenue decimal.Decimal `json:"revenue"`
	Orders  int             `json:"orders"`
}
