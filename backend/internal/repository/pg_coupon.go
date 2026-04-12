package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgCouponRepo struct {
	pool *pgxpool.Pool
}

func NewCouponRepository(pool *pgxpool.Pool) domain.CouponRepository {
	return &pgCouponRepo{pool: pool}
}

func (r *pgCouponRepo) Create(ctx context.Context, coupon *domain.Coupon) error {
	coupon.ID = uuid.New()
	query := `INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount, usage_limit, valid_from, valid_to, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING created_at`
	return r.pool.QueryRow(ctx, query,
		coupon.ID, coupon.Code, coupon.Type, coupon.Value, coupon.MinOrderAmount,
		coupon.MaxDiscount, coupon.UsageLimit, coupon.ValidFrom, coupon.ValidTo, coupon.IsActive,
	).Scan(&coupon.CreatedAt)
}

func (r *pgCouponRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Coupon, error) {
	c := &domain.Coupon{}
	query := `SELECT id, code, type, value, min_order_amount, max_discount, usage_limit, used_count, valid_from, valid_to, is_active, created_at
		FROM coupons WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Code, &c.Type, &c.Value, &c.MinOrderAmount, &c.MaxDiscount,
		&c.UsageLimit, &c.UsedCount, &c.ValidFrom, &c.ValidTo, &c.IsActive, &c.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("coupon not found")
	}
	return c, err
}

func (r *pgCouponRepo) GetByCode(ctx context.Context, code string) (*domain.Coupon, error) {
	c := &domain.Coupon{}
	query := `SELECT id, code, type, value, min_order_amount, max_discount, usage_limit, used_count, valid_from, valid_to, is_active, created_at
		FROM coupons WHERE code = $1`
	err := r.pool.QueryRow(ctx, query, code).Scan(
		&c.ID, &c.Code, &c.Type, &c.Value, &c.MinOrderAmount, &c.MaxDiscount,
		&c.UsageLimit, &c.UsedCount, &c.ValidFrom, &c.ValidTo, &c.IsActive, &c.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (r *pgCouponRepo) Update(ctx context.Context, coupon *domain.Coupon) error {
	query := `UPDATE coupons SET code=$1, type=$2, value=$3, min_order_amount=$4, max_discount=$5,
		usage_limit=$6, valid_from=$7, valid_to=$8, is_active=$9 WHERE id=$10`
	_, err := r.pool.Exec(ctx, query,
		coupon.Code, coupon.Type, coupon.Value, coupon.MinOrderAmount, coupon.MaxDiscount,
		coupon.UsageLimit, coupon.ValidFrom, coupon.ValidTo, coupon.IsActive, coupon.ID,
	)
	return err
}

func (r *pgCouponRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM coupons WHERE id = $1`, id)
	return err
}

func (r *pgCouponRepo) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, id)
	return err
}

func (r *pgCouponRepo) List(ctx context.Context, page, limit int) ([]domain.Coupon, int64, error) {
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM coupons`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx,
		`SELECT id, code, type, value, min_order_amount, max_discount, usage_limit, used_count, valid_from, valid_to, is_active, created_at
		FROM coupons ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var coupons []domain.Coupon
	for rows.Next() {
		var c domain.Coupon
		if err := rows.Scan(&c.ID, &c.Code, &c.Type, &c.Value, &c.MinOrderAmount, &c.MaxDiscount,
			&c.UsageLimit, &c.UsedCount, &c.ValidFrom, &c.ValidTo, &c.IsActive, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		coupons = append(coupons, c)
	}
	return coupons, total, nil
}
