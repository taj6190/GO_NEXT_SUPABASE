package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgReviewRepo struct {
	pool *pgxpool.Pool
}

func NewReviewRepository(pool *pgxpool.Pool) domain.ReviewRepository {
	return &pgReviewRepo{pool: pool}
}

func (r *pgReviewRepo) Create(ctx context.Context, review *domain.Review) error {
	review.ID = uuid.New()
	query := `INSERT INTO product_reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase, is_approved)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING created_at, updated_at`
	return r.pool.QueryRow(ctx, query,
		review.ID, review.ProductID, review.UserID, review.Rating, review.Title, review.Comment,
		review.IsVerifiedPurchase, review.IsApproved,
	).Scan(&review.CreatedAt, &review.UpdatedAt)
}

func (r *pgReviewRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Review, error) {
	rv := &domain.Review{}
	err := r.pool.QueryRow(ctx, `SELECT r.id, r.product_id, r.user_id, COALESCE(u.full_name,''), r.rating, r.title, r.comment, r.is_verified_purchase, r.is_approved, r.created_at, r.updated_at
		FROM product_reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = $1`, id).Scan(
		&rv.ID, &rv.ProductID, &rv.UserID, &rv.UserName, &rv.Rating, &rv.Title, &rv.Comment,
		&rv.IsVerifiedPurchase, &rv.IsApproved, &rv.CreatedAt, &rv.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("review not found")
	}
	return rv, err
}

func (r *pgReviewRepo) Update(ctx context.Context, review *domain.Review) error {
	_, err := r.pool.Exec(ctx, `UPDATE product_reviews SET rating=$1, title=$2, comment=$3, is_approved=$4, updated_at=NOW() WHERE id=$5`,
		review.Rating, review.Title, review.Comment, review.IsApproved, review.ID)
	return err
}

func (r *pgReviewRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM product_reviews WHERE id = $1`, id)
	return err
}

func (r *pgReviewRepo) ListByProduct(ctx context.Context, productID uuid.UUID, filter domain.ReviewFilter) ([]domain.Review, int64, error) {
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND is_approved = true`, productID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	sortBy := "r.created_at"
	sortOrder := "DESC"
	if filter.SortBy == "rating" {
		sortBy = "r.rating"
	}
	if filter.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	offset := (filter.Page - 1) * filter.Limit
	query := fmt.Sprintf(`SELECT r.id, r.product_id, r.user_id, COALESCE(u.full_name,'Anonymous'), r.rating, r.title, r.comment,
		r.is_verified_purchase, r.is_approved, r.created_at, r.updated_at
		FROM product_reviews r LEFT JOIN users u ON r.user_id = u.id
		WHERE r.product_id = $1 AND r.is_approved = true
		ORDER BY %s %s LIMIT $2 OFFSET $3`, sortBy, sortOrder)

	rows, err := r.pool.Query(ctx, query, productID, filter.Limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reviews []domain.Review
	for rows.Next() {
		var rv domain.Review
		if err := rows.Scan(&rv.ID, &rv.ProductID, &rv.UserID, &rv.UserName, &rv.Rating, &rv.Title, &rv.Comment,
			&rv.IsVerifiedPurchase, &rv.IsApproved, &rv.CreatedAt, &rv.UpdatedAt); err != nil {
			return nil, 0, err
		}
		reviews = append(reviews, rv)
	}
	return reviews, total, nil
}

func (r *pgReviewRepo) GetSummary(ctx context.Context, productID uuid.UUID) (*domain.ReviewSummary, error) {
	summary := &domain.ReviewSummary{Distribution: make(map[int]int)}

	err := r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(rating), 0)::FLOAT8, COUNT(*) FROM product_reviews WHERE product_id = $1 AND is_approved = true`, productID).
		Scan(&summary.AverageRating, &summary.TotalReviews)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `SELECT rating, COUNT(*) FROM product_reviews WHERE product_id = $1 AND is_approved = true GROUP BY rating`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rating, count int
		if err := rows.Scan(&rating, &count); err != nil {
			return nil, err
		}
		summary.Distribution[rating] = count
	}
	return summary, nil
}

func (r *pgReviewRepo) HasUserReviewed(ctx context.Context, productID uuid.UUID, userID uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND user_id = $2`, productID, userID).Scan(&count)
	return count > 0, err
}

func (r *pgReviewRepo) HasUserPurchased(ctx context.Context, productID uuid.UUID, userID uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM order_items oi
		JOIN orders o ON oi.order_id = o.id
		WHERE oi.product_id = $1 AND o.user_id = $2 AND o.status IN ('delivered', 'completed')`, productID, userID).Scan(&count)
	return count > 0, err
}
