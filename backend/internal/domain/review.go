package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Review struct {
	ID                 uuid.UUID `json:"id"`
	ProductID          uuid.UUID `json:"product_id"`
	UserID             uuid.UUID `json:"user_id"`
	UserName           string    `json:"user_name,omitempty"`
	Rating             int       `json:"rating"`
	Title              string    `json:"title"`
	Comment            string    `json:"comment"`
	IsVerifiedPurchase bool      `json:"is_verified_purchase"`
	IsApproved         bool      `json:"is_approved"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type CreateReviewInput struct {
	ProductID uuid.UUID `json:"product_id" binding:"required"`
	Rating    int       `json:"rating" binding:"required,min=1,max=5"`
	Title     string    `json:"title"`
	Comment   string    `json:"comment"`
}

type ReviewSummary struct {
	AverageRating float64 `json:"average_rating"`
	TotalReviews  int     `json:"total_reviews"`
	Distribution  map[int]int `json:"distribution"` // star -> count
}

type ReviewFilter struct {
	ProductID *uuid.UUID
	Rating    *int
	SortBy    string // created_at, rating
	SortOrder string // asc, desc
	Page      int
	Limit     int
}

type ReviewRepository interface {
	Create(ctx context.Context, review *Review) error
	GetByID(ctx context.Context, id uuid.UUID) (*Review, error)
	Update(ctx context.Context, review *Review) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListByProduct(ctx context.Context, productID uuid.UUID, filter ReviewFilter) ([]Review, int64, error)
	GetSummary(ctx context.Context, productID uuid.UUID) (*ReviewSummary, error)
	HasUserReviewed(ctx context.Context, productID uuid.UUID, userID uuid.UUID) (bool, error)
	HasUserPurchased(ctx context.Context, productID uuid.UUID, userID uuid.UUID) (bool, error)
}
