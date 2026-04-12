package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/shopspring/decimal"
)

type CartService struct {
	cartRepo    domain.CartRepository
	productRepo domain.ProductRepository
}

func NewCartService(cartRepo domain.CartRepository, productRepo domain.ProductRepository) *CartService {
	return &CartService{cartRepo: cartRepo, productRepo: productRepo}
}

func effectivePrice(price, discountPrice decimal.Decimal) decimal.Decimal {
	if discountPrice.GreaterThan(decimal.Zero) && discountPrice.LessThan(price) {
		return discountPrice
	}
	return price
}

func (s *CartService) AddItem(ctx context.Context, userID *uuid.UUID, sessionID string, input domain.AddToCartInput) (*domain.CartItem, error) {
	product, err := s.productRepo.GetByID(ctx, input.ProductID)
	if err != nil {
		return nil, fmt.Errorf("product not found")
	}
	if !product.IsActive {
		return nil, fmt.Errorf("product is not available")
	}

	var variant *domain.Variant
	if input.VariantID != nil {
		v, err := s.productRepo.GetVariantByID(ctx, *input.VariantID)
		if err != nil || v == nil {
			return nil, fmt.Errorf("invalid variant")
		}
		if v.ProductID != input.ProductID {
			return nil, fmt.Errorf("variant does not match product")
		}
		if !v.IsActive {
			return nil, fmt.Errorf("variant is not available")
		}
		if v.StockQuantity < input.Quantity {
			return nil, fmt.Errorf("insufficient stock")
		}
		variant = v
	} else {
		if product.StockQuantity < input.Quantity {
			return nil, fmt.Errorf("insufficient stock")
		}
	}

	if userID != nil {
		existing, _ := s.cartRepo.GetByUserProductVariant(ctx, *userID, input.ProductID, input.VariantID)
		if existing != nil {
			newQty := existing.Quantity + input.Quantity
			if variant != nil {
				if variant.StockQuantity < newQty {
					return nil, fmt.Errorf("insufficient stock")
				}
			} else if product.StockQuantity < newQty {
				return nil, fmt.Errorf("insufficient stock")
			}
			if err := s.cartRepo.UpdateQuantity(ctx, existing.ID, newQty); err != nil {
				return nil, err
			}
			existing.Quantity = newQty
			return existing, nil
		}
	} else if sessionID != "" {
		existing, _ := s.cartRepo.GetBySessionProductVariant(ctx, sessionID, input.ProductID, input.VariantID)
		if existing != nil {
			newQty := existing.Quantity + input.Quantity
			if variant != nil {
				if variant.StockQuantity < newQty {
					return nil, fmt.Errorf("insufficient stock")
				}
			} else if product.StockQuantity < newQty {
				return nil, fmt.Errorf("insufficient stock")
			}
			if err := s.cartRepo.UpdateQuantity(ctx, existing.ID, newQty); err != nil {
				return nil, err
			}
			existing.Quantity = newQty
			return existing, nil
		}
	}

	item := &domain.CartItem{
		UserID:    userID,
		SessionID: sessionID,
		ProductID: input.ProductID,
		VariantID: input.VariantID,
		Quantity:  input.Quantity,
	}

	if err := s.cartRepo.AddItem(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to add item to cart: %w", err)
	}

	return item, nil
}

func (s *CartService) UpdateItem(ctx context.Context, itemID uuid.UUID, quantity int) error {
	item, err := s.cartRepo.GetItem(ctx, itemID)
	if err != nil {
		return err
	}

	if item.VariantID != nil {
		v, err := s.productRepo.GetVariantByID(ctx, *item.VariantID)
		if err != nil || v == nil {
			return fmt.Errorf("variant not found")
		}
		if v.StockQuantity < quantity {
			return fmt.Errorf("insufficient stock")
		}
	} else {
		product, err := s.productRepo.GetByID(ctx, item.ProductID)
		if err != nil {
			return fmt.Errorf("product not found")
		}
		if product.StockQuantity < quantity {
			return fmt.Errorf("insufficient stock")
		}
	}

	return s.cartRepo.UpdateQuantity(ctx, itemID, quantity)
}

func (s *CartService) RemoveItem(ctx context.Context, itemID uuid.UUID) error {
	return s.cartRepo.RemoveItem(ctx, itemID)
}

func (s *CartService) GetCart(ctx context.Context, userID *uuid.UUID, sessionID string) ([]domain.CartItem, error) {
	if userID != nil {
		return s.cartRepo.GetUserCart(ctx, *userID)
	}
	if sessionID != "" {
		return s.cartRepo.GetSessionCart(ctx, sessionID)
	}
	return nil, nil
}

func (s *CartService) ClearCart(ctx context.Context, userID *uuid.UUID, sessionID string) error {
	if userID != nil {
		return s.cartRepo.ClearUserCart(ctx, *userID)
	}
	if sessionID != "" {
		return s.cartRepo.ClearSessionCart(ctx, sessionID)
	}
	return nil
}

func (s *CartService) MergeCart(ctx context.Context, sessionID string, userID uuid.UUID) error {
	return s.cartRepo.MergeSessionToUser(ctx, sessionID, userID)
}
