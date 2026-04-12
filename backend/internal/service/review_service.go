package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type ReviewService struct {
	reviewRepo  domain.ReviewRepository
	productRepo domain.ProductRepository
}

func NewReviewService(reviewRepo domain.ReviewRepository, productRepo domain.ProductRepository) *ReviewService {
	return &ReviewService{reviewRepo: reviewRepo, productRepo: productRepo}
}

func (s *ReviewService) Create(ctx context.Context, userID uuid.UUID, input domain.CreateReviewInput) (*domain.Review, error) {
	// Check if user already reviewed
	reviewed, _ := s.reviewRepo.HasUserReviewed(ctx, input.ProductID, userID)
	if reviewed {
		return nil, fmt.Errorf("you have already reviewed this product")
	}

	// Check if user purchased
	purchased, _ := s.reviewRepo.HasUserPurchased(ctx, input.ProductID, userID)

	review := &domain.Review{
		ProductID:          input.ProductID,
		UserID:             userID,
		Rating:             input.Rating,
		Title:              input.Title,
		Comment:            input.Comment,
		IsVerifiedPurchase: purchased,
		IsApproved:         true,
	}

	if err := s.reviewRepo.Create(ctx, review); err != nil {
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	// Update product rating
	_ = s.productRepo.UpdateProductRating(ctx, input.ProductID)

	return review, nil
}

func (s *ReviewService) ListByProduct(ctx context.Context, productID uuid.UUID, filter domain.ReviewFilter) ([]domain.Review, int64, error) {
	return s.reviewRepo.ListByProduct(ctx, productID, filter)
}

func (s *ReviewService) GetSummary(ctx context.Context, productID uuid.UUID) (*domain.ReviewSummary, error) {
	return s.reviewRepo.GetSummary(ctx, productID)
}

func (s *ReviewService) Delete(ctx context.Context, id uuid.UUID) error {
	review, err := s.reviewRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.reviewRepo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.productRepo.UpdateProductRating(ctx, review.ProductID)
	return nil
}
