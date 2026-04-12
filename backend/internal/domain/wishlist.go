package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Wishlist struct {
	ID        uuid.UUID      `json:"id"`
	UserID    uuid.UUID      `json:"user_id"`
	Name      string         `json:"name"`
	Items     []WishlistItem `json:"items,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

type WishlistItem struct {
	ID        uuid.UUID `json:"id"`
	WishlistID uuid.UUID `json:"wishlist_id"`
	ProductID uuid.UUID `json:"product_id"`
	Product   *Product  `json:"product,omitempty"`
	AddedAt   time.Time `json:"added_at"`
}

type AddToWishlistInput struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
}

type WishlistRepository interface {
	GetOrCreateDefault(ctx context.Context, userID uuid.UUID) (*Wishlist, error)
	AddItem(ctx context.Context, item *WishlistItem) error
	RemoveItem(ctx context.Context, wishlistID uuid.UUID, productID uuid.UUID) error
	GetItems(ctx context.Context, wishlistID uuid.UUID) ([]WishlistItem, error)
	HasItem(ctx context.Context, wishlistID uuid.UUID, productID uuid.UUID) (bool, error)
}
