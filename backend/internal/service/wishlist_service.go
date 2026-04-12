package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type WishlistService struct {
	wishlistRepo domain.WishlistRepository
}

func NewWishlistService(wishlistRepo domain.WishlistRepository) *WishlistService {
	return &WishlistService{wishlistRepo: wishlistRepo}
}

func (s *WishlistService) GetWishlist(ctx context.Context, userID uuid.UUID) (*domain.Wishlist, error) {
	return s.wishlistRepo.GetOrCreateDefault(ctx, userID)
}

func (s *WishlistService) AddItem(ctx context.Context, userID uuid.UUID, productID uuid.UUID) error {
	wishlist, err := s.wishlistRepo.GetOrCreateDefault(ctx, userID)
	if err != nil {
		return err
	}

	item := &domain.WishlistItem{
		WishlistID: wishlist.ID,
		ProductID:  productID,
	}
	return s.wishlistRepo.AddItem(ctx, item)
}

func (s *WishlistService) RemoveItem(ctx context.Context, userID uuid.UUID, productID uuid.UUID) error {
	wishlist, err := s.wishlistRepo.GetOrCreateDefault(ctx, userID)
	if err != nil {
		return err
	}
	return s.wishlistRepo.RemoveItem(ctx, wishlist.ID, productID)
}
