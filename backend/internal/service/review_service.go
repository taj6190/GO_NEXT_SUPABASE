package service

import (
	"context"
	"fmt"
	"time"

	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type ReviewService struct {
	reviewRepo  domain.ReviewRepository
	productRepo domain.ProductRepository
	cache       *utils.CacheManager
}

func NewReviewService(reviewRepo domain.ReviewRepository, productRepo domain.ProductRepository, rdb *redis.Client) *ReviewService {
	return &ReviewService{
		reviewRepo:  reviewRepo,
		productRepo: productRepo,
		cache:       utils.NewCacheManager(rdb),
	}
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

	// Invalidate cache
	s.invalidateCache(ctx, input.ProductID)

	return review, nil
}

func (s *ReviewService) ListByProduct(ctx context.Context, productID uuid.UUID, filter domain.ReviewFilter) ([]domain.Review, int64, error) {
	return s.reviewRepo.ListByProduct(ctx, productID, filter)
}

func (s *ReviewService) GetSummary(ctx context.Context, productID uuid.UUID) (*domain.ReviewSummary, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("review:summary:%s", productID)
	var cached domain.ReviewSummary
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	// Cache miss - fetch from database
	summary, err := s.reviewRepo.GetSummary(ctx, productID)
	if err != nil {
		return nil, err
	}

	// Cache the summary for 1 hour
	_ = s.cache.Set(ctx, cacheKey, summary, 1*time.Hour)

	return summary, nil
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

	// Invalidate cache
	s.invalidateCache(ctx, review.ProductID)

	return nil
}

func (s *ReviewService) invalidateCache(ctx context.Context, productID uuid.UUID) {
	_ = s.cache.Delete(ctx, fmt.Sprintf("review:summary:%s", productID))
}
