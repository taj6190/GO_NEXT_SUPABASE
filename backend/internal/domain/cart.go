package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID           uuid.UUID  `json:"id"`
	UserID       *uuid.UUID `json:"user_id"`
	SessionID    string     `json:"session_id,omitempty"`
	ProductID    uuid.UUID  `json:"product_id"`
	VariantID    *uuid.UUID `json:"variant_id,omitempty"`
	Quantity     int        `json:"quantity"`
	Product      *Product   `json:"product,omitempty"`
	Variant      *Variant   `json:"variant,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type AddToCartInput struct {
	ProductID uuid.UUID  `json:"product_id" binding:"required"`
	VariantID *uuid.UUID `json:"variant_id,omitempty"`
	Quantity  int        `json:"quantity" binding:"required,min=1"`
}

type UpdateCartItemInput struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type CartRepository interface {
	AddItem(ctx context.Context, item *CartItem) error
	GetItem(ctx context.Context, id uuid.UUID) (*CartItem, error)
	GetByUserProductVariant(ctx context.Context, userID uuid.UUID, productID uuid.UUID, variantID *uuid.UUID) (*CartItem, error)
	GetBySessionProductVariant(ctx context.Context, sessionID string, productID uuid.UUID, variantID *uuid.UUID) (*CartItem, error)
	UpdateQuantity(ctx context.Context, id uuid.UUID, quantity int) error
	RemoveItem(ctx context.Context, id uuid.UUID) error
	GetUserCart(ctx context.Context, userID uuid.UUID) ([]CartItem, error)
	GetSessionCart(ctx context.Context, sessionID string) ([]CartItem, error)
	ClearUserCart(ctx context.Context, userID uuid.UUID) error
	ClearSessionCart(ctx context.Context, sessionID string) error
	MergeSessionToUser(ctx context.Context, sessionID string, userID uuid.UUID) error
}
