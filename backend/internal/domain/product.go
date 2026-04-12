package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Product struct {
	ID               uuid.UUID       `json:"id"`
	CategoryID       uuid.UUID       `json:"category_id"`
	CategoryName     string          `json:"category_name,omitempty"`
	Name             string          `json:"name"`
	Slug             string          `json:"slug"`
	Description      string          `json:"description"`
	ShortDescription string          `json:"short_description"`
	Price            decimal.Decimal `json:"price"`
	DiscountPrice    decimal.Decimal `json:"discount_price"`
	StockQuantity    int             `json:"stock_quantity"`
	SKU              string          `json:"sku"`
	IsActive         bool            `json:"is_active"`
	IsFeatured       bool            `json:"is_featured"`
	Weight           decimal.Decimal `json:"weight"`
	Attributes       JSON            `json:"attributes"`
	AverageRating    float64         `json:"average_rating"`
	ReviewCount      int             `json:"review_count"`
	Images           []ProductImage  `json:"images,omitempty"`
	Variants         []Variant       `json:"variants,omitempty"`
	OptionGroups     []OptionGroup   `json:"option_groups,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
}

type ProductImage struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"product_id"`
	ImageURL  string    `json:"image_url"`
	IsPrimary bool      `json:"is_primary"`
	SortOrder int       `json:"sort_order"`
}

// OptionGroup defines a variation axis (e.g. "Color", "Size", "Storage")
type OptionGroup struct {
	ID        uuid.UUID     `json:"id"`
	ProductID uuid.UUID     `json:"product_id"`
	Name      string        `json:"name"`
	SortOrder int           `json:"sort_order"`
	Values    []OptionValue `json:"values,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
}

// OptionValue is a specific choice within an option group (e.g. "Red", "XL")
type OptionValue struct {
	ID            uuid.UUID `json:"id"`
	OptionGroupID uuid.UUID `json:"option_group_id"`
	Value         string    `json:"value"`
	ColorHex      string    `json:"color_hex,omitempty"`
	SortOrder     int       `json:"sort_order"`
}

// Variant is a purchasable combination (e.g. Red/XL)
type Variant struct {
	ID           uuid.UUID      `json:"id"`
	ProductID    uuid.UUID      `json:"product_id"`
	SKU          string         `json:"sku"`
	Price        decimal.Decimal `json:"price"`
	DiscountPrice decimal.Decimal `json:"discount_price"`
	StockQuantity int           `json:"stock_quantity"`
	Weight       decimal.Decimal `json:"weight"`
	IsActive     bool           `json:"is_active"`
	SortOrder    int            `json:"sort_order"`
	Options      []VariantOption `json:"options,omitempty"`
	Images       []VariantImage  `json:"images,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
}

// VariantOption maps a variant to a specific option value
type VariantOption struct {
	ID            uuid.UUID `json:"id"`
	VariantID     uuid.UUID `json:"variant_id"`
	OptionGroupID uuid.UUID `json:"option_group_id"`
	OptionValueID uuid.UUID `json:"option_value_id"`
	GroupName     string    `json:"group_name,omitempty"`
	ValueName     string    `json:"value_name,omitempty"`
}

// VariantImage is an image specific to a variant
type VariantImage struct {
	ID        uuid.UUID `json:"id"`
	VariantID uuid.UUID `json:"variant_id"`
	ImageURL  string    `json:"image_url"`
	IsPrimary bool      `json:"is_primary"`
	SortOrder int       `json:"sort_order"`
}

type CreateProductInput struct {
	CategoryID       uuid.UUID       `json:"category_id" binding:"required"`
	Name             string          `json:"name" binding:"required"`
	Description      string          `json:"description"`
	ShortDescription string          `json:"short_description"`
	Price            decimal.Decimal `json:"price" binding:"required"`
	DiscountPrice    decimal.Decimal `json:"discount_price"`
	StockQuantity    int             `json:"stock_quantity"`
	SKU              string          `json:"sku" binding:"required"`
	IsActive         bool            `json:"is_active"`
	IsFeatured       bool            `json:"is_featured"`
	Weight           decimal.Decimal `json:"weight"`
	Attributes       JSON            `json:"attributes"`
	ImageURLs        []string        `json:"image_urls"`
	OptionGroups     []CreateOptionGroupInput `json:"option_groups,omitempty"`
	Variants         []CreateVariantInput     `json:"variants,omitempty"`
}

type UpdateProductInput struct {
	CategoryID       *uuid.UUID       `json:"category_id"`
	Name             string           `json:"name"`
	Description      string           `json:"description"`
	ShortDescription string           `json:"short_description"`
	Price            *decimal.Decimal `json:"price"`
	DiscountPrice    *decimal.Decimal `json:"discount_price"`
	StockQuantity    *int             `json:"stock_quantity"`
	SKU              string           `json:"sku"`
	IsActive         *bool            `json:"is_active"`
	IsFeatured       *bool            `json:"is_featured"`
	Weight           *decimal.Decimal `json:"weight"`
	Attributes       JSON             `json:"attributes"`
	ImageURLs        []string         `json:"image_urls"`
	OptionGroups     []CreateOptionGroupInput `json:"option_groups,omitempty"`
	Variants         []CreateVariantInput     `json:"variants,omitempty"`
}

type CreateOptionGroupInput struct {
	Name      string   `json:"name" binding:"required"`
	SortOrder int      `json:"sort_order"`
	Values    []CreateOptionValueInput `json:"values"`
}

type CreateOptionValueInput struct {
	Value    string `json:"value" binding:"required"`
	ColorHex string `json:"color_hex"`
	SortOrder int   `json:"sort_order"`
}

type CreateVariantInput struct {
	SKU           string          `json:"sku" binding:"required"`
	Price         decimal.Decimal `json:"price"`
	DiscountPrice decimal.Decimal `json:"discount_price"`
	StockQuantity int             `json:"stock_quantity"`
	Weight        decimal.Decimal `json:"weight"`
	IsActive      bool            `json:"is_active"`
	SortOrder     int             `json:"sort_order"`
	OptionValues  []uuid.UUID     `json:"option_values"` // IDs of selected OptionValues
	ImageURLs     []string        `json:"image_urls"`
}

type ProductFilter struct {
	CategoryID *uuid.UUID
	Search     string
	MinPrice   *decimal.Decimal
	MaxPrice   *decimal.Decimal
	IsActive   *bool
	IsFeatured *bool
	MinRating  *float64
	SortBy     string // name, price, created_at, rating
	SortOrder  string // asc, desc
	Page       int
	Limit      int
}

type ProductRepository interface {
	Create(ctx context.Context, product *Product) error
	GetByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetBySlug(ctx context.Context, slug string) (*Product, error)
	Update(ctx context.Context, product *Product) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter ProductFilter) ([]Product, int64, error)
	GetFeatured(ctx context.Context, limit int) ([]Product, error)
	UpdateStock(ctx context.Context, id uuid.UUID, quantity int) error
	GetRelated(ctx context.Context, productID uuid.UUID, categoryID uuid.UUID, limit int) ([]Product, error)

	// Images
	AddImage(ctx context.Context, image *ProductImage) error
	DeleteImage(ctx context.Context, id uuid.UUID) error
	GetImages(ctx context.Context, productID uuid.UUID) ([]ProductImage, error)
	DeleteImagesByProductID(ctx context.Context, productID uuid.UUID) error

	// Option Groups
	CreateOptionGroup(ctx context.Context, og *OptionGroup) error
	GetOptionGroups(ctx context.Context, productID uuid.UUID) ([]OptionGroup, error)
	DeleteOptionGroupsByProductID(ctx context.Context, productID uuid.UUID) error
	CreateOptionValue(ctx context.Context, ov *OptionValue) error

	// Variants
	CreateVariant(ctx context.Context, v *Variant) error
	GetVariants(ctx context.Context, productID uuid.UUID) ([]Variant, error)
	GetVariantByID(ctx context.Context, id uuid.UUID) (*Variant, error)
	DeleteVariantsByProductID(ctx context.Context, productID uuid.UUID) error
	CreateVariantOption(ctx context.Context, vo *VariantOption) error
	GetVariantOptions(ctx context.Context, variantID uuid.UUID) ([]VariantOption, error)
	AddVariantImage(ctx context.Context, img *VariantImage) error
	GetVariantImages(ctx context.Context, variantID uuid.UUID) ([]VariantImage, error)
	UpdateVariantStock(ctx context.Context, variantID uuid.UUID, quantity int) error

	// Rating
	UpdateProductRating(ctx context.Context, productID uuid.UUID) error

	// Stats
	Count(ctx context.Context) (int64, error)
	CountLowStock(ctx context.Context, threshold int) (int64, error)
}
