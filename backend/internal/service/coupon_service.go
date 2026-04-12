package service

import (
	"context"
	"fmt"
	"time"

	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/shopspring/decimal"
)

type CouponService struct {
	couponRepo domain.CouponRepository
	cache      *utils.CacheManager
}

func NewCouponService(couponRepo domain.CouponRepository, rdb *redis.Client) *CouponService {
	return &CouponService{
		couponRepo: couponRepo,
		cache:      utils.NewCacheManager(rdb),
	}
}

func (s *CouponService) Create(ctx context.Context, input domain.CreateCouponInput) (*domain.Coupon, error) {
	coupon := &domain.Coupon{
		Code:           input.Code,
		Type:           input.Type,
		Value:          input.Value,
		MinOrderAmount: input.MinOrderAmount,
		MaxDiscount:    input.MaxDiscount,
		UsageLimit:     input.UsageLimit,
		ValidFrom:      input.ValidFrom,
		ValidTo:        input.ValidTo,
		IsActive:       input.IsActive,
	}
	err := s.couponRepo.Create(ctx, coupon)
	return coupon, err
}

func (s *CouponService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Coupon, error) {
	return s.couponRepo.GetByID(ctx, id)
}

func (s *CouponService) Update(ctx context.Context, id uuid.UUID, input domain.UpdateCouponInput) (*domain.Coupon, error) {
	coupon, err := s.couponRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.Code != "" {
		coupon.Code = input.Code
	}
	if input.Type != "" {
		coupon.Type = input.Type
	}
	if input.Value != nil {
		coupon.Value = *input.Value
	}
	if input.MinOrderAmount != nil {
		coupon.MinOrderAmount = *input.MinOrderAmount
	}
	if input.MaxDiscount != nil {
		coupon.MaxDiscount = *input.MaxDiscount
	}
	if input.UsageLimit != nil {
		coupon.UsageLimit = *input.UsageLimit
	}
	if input.ValidFrom != nil {
		coupon.ValidFrom = *input.ValidFrom
	}
	if input.ValidTo != nil {
		coupon.ValidTo = *input.ValidTo
	}
	if input.IsActive != nil {
		coupon.IsActive = *input.IsActive
	}

	err = s.couponRepo.Update(ctx, coupon)
	if err == nil {
		s.invalidateCache(ctx, coupon.Code)
	}
	return coupon, err
}

func (s *CouponService) Delete(ctx context.Context, id uuid.UUID) error {
	coupon, err := s.couponRepo.GetByID(ctx, id)
	if err == nil {
		_ = s.cache.Delete(ctx, fmt.Sprintf("coupon:code:%s", coupon.Code))
	}
	return s.couponRepo.Delete(ctx, id)
}

func (s *CouponService) Validate(ctx context.Context, code string, orderTotal decimal.Decimal) (*domain.Coupon, decimal.Decimal, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("coupon:code:%s", code)
	var cachedCoupon domain.Coupon
	if err := s.cache.Get(ctx, cacheKey, &cachedCoupon); err == nil {
		coupon := &cachedCoupon
		// Validating in memory but need to pass through validation logic
		if !coupon.IsActive {
			return nil, decimal.Zero, fmt.Errorf("coupon is inactive")
		}

		now := time.Now()
		if now.Before(coupon.ValidFrom) {
			return nil, decimal.Zero, fmt.Errorf("coupon is not yet valid")
		}
		if now.After(coupon.ValidTo) {
			return nil, decimal.Zero, fmt.Errorf("coupon has expired")
		}

		if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
			return nil, decimal.Zero, fmt.Errorf("coupon usage limit reached")
		}

		if orderTotal.LessThan(coupon.MinOrderAmount) {
			return nil, decimal.Zero, fmt.Errorf("minimum order amount is ৳%s", coupon.MinOrderAmount.String())
		}

		var discount decimal.Decimal
		if coupon.Type == domain.CouponTypePercentage {
			discount = orderTotal.Mul(coupon.Value).Div(decimal.NewFromInt(100))
			if coupon.MaxDiscount.GreaterThan(decimal.Zero) && discount.GreaterThan(coupon.MaxDiscount) {
				discount = coupon.MaxDiscount
			}
		} else {
			discount = coupon.Value
		}

		return coupon, discount, nil
	}

	// Cache miss - fetch from database
	coupon, err := s.couponRepo.GetByCode(ctx, code)
	if err != nil || coupon == nil {
		return nil, decimal.Zero, fmt.Errorf("coupon not found")
	}

	// Cache the coupon for 1 hour
	_ = s.cache.Set(ctx, cacheKey, coupon, 1*time.Hour)

	if !coupon.IsActive {
		return nil, decimal.Zero, fmt.Errorf("coupon is inactive")
	}

	now := time.Now()
	if now.Before(coupon.ValidFrom) {
		return nil, decimal.Zero, fmt.Errorf("coupon is not yet valid")
	}
	if now.After(coupon.ValidTo) {
		return nil, decimal.Zero, fmt.Errorf("coupon has expired")
	}

	if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
		return nil, decimal.Zero, fmt.Errorf("coupon usage limit reached")
	}

	if orderTotal.LessThan(coupon.MinOrderAmount) {
		return nil, decimal.Zero, fmt.Errorf("minimum order amount is ৳%s", coupon.MinOrderAmount.String())
	}

	var discount decimal.Decimal
	if coupon.Type == domain.CouponTypePercentage {
		discount = orderTotal.Mul(coupon.Value).Div(decimal.NewFromInt(100))
		if coupon.MaxDiscount.GreaterThan(decimal.Zero) && discount.GreaterThan(coupon.MaxDiscount) {
			discount = coupon.MaxDiscount
		}
	} else {
		discount = coupon.Value
	}

	return coupon, discount, nil
}

func (s *CouponService) invalidateCache(ctx context.Context, code string) {
	_ = s.cache.Delete(ctx, fmt.Sprintf("coupon:code:%s", code))
}

func (s *CouponService) List(ctx context.Context, page, limit int) ([]domain.Coupon, int64, error) {
	return s.couponRepo.List(ctx, page, limit)
}
