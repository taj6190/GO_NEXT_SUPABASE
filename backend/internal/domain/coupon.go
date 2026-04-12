package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type CouponType string

const (
	CouponTypePercentage CouponType = "percentage"
	CouponTypeFixed      CouponType = "fixed"
)

type Coupon struct {
	ID             uuid.UUID       `json:"id"`
	Code           string          `json:"code"`
	Type           CouponType      `json:"type"`
	Value          decimal.Decimal `json:"value"`
	MinOrderAmount decimal.Decimal `json:"min_order_amount"`
	MaxDiscount    decimal.Decimal `json:"max_discount"`
	UsageLimit     int             `json:"usage_limit"`
	UsedCount      int             `json:"used_count"`
	ValidFrom      time.Time       `json:"valid_from"`
	ValidTo        time.Time       `json:"valid_to"`
	IsActive       bool            `json:"is_active"`
	CreatedAt      time.Time       `json:"created_at"`
}

type CreateCouponInput struct {
	Code           string          `json:"code" binding:"required"`
	Type           CouponType      `json:"type" binding:"required"`
	Value          decimal.Decimal `json:"value" binding:"required"`
	MinOrderAmount decimal.Decimal `json:"min_order_amount"`
	MaxDiscount    decimal.Decimal `json:"max_discount"`
	UsageLimit     int             `json:"usage_limit"`
	ValidFrom      time.Time       `json:"valid_from" binding:"required"`
	ValidTo        time.Time       `json:"valid_to" binding:"required"`
	IsActive       bool            `json:"is_active"`
}

type UpdateCouponInput struct {
	Code           string           `json:"code"`
	Type           CouponType       `json:"type"`
	Value          *decimal.Decimal `json:"value"`
	MinOrderAmount *decimal.Decimal `json:"min_order_amount"`
	MaxDiscount    *decimal.Decimal `json:"max_discount"`
	UsageLimit     *int             `json:"usage_limit"`
	ValidFrom      *time.Time       `json:"valid_from"`
	ValidTo        *time.Time       `json:"valid_to"`
	IsActive       *bool            `json:"is_active"`
}

type CouponRepository interface {
	Create(ctx context.Context, coupon *Coupon) error
	GetByID(ctx context.Context, id uuid.UUID) (*Coupon, error)
	GetByCode(ctx context.Context, code string) (*Coupon, error)
	Update(ctx context.Context, coupon *Coupon) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementUsage(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, page, limit int) ([]Coupon, int64, error)
}
