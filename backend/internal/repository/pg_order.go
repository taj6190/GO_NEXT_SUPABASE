package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/shopspring/decimal"
)

type pgOrderRepo struct {
	pool *pgxpool.Pool
}

func NewOrderRepository(pool *pgxpool.Pool) domain.OrderRepository {
	return &pgOrderRepo{pool: pool}
}

func (r *pgOrderRepo) Create(ctx context.Context, order *domain.Order) error {
	order.ID = uuid.New()
	query := `INSERT INTO orders (id, user_id, guest_email, guest_phone, order_number, status, subtotal, discount_amount, shipping_cost, total, coupon_id, shipping_address_id, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING created_at, updated_at`
	return r.pool.QueryRow(ctx, query,
		order.ID, order.UserID, order.GuestEmail, order.GuestPhone, order.OrderNumber,
		order.Status, order.Subtotal, order.DiscountAmount, order.ShippingCost, order.Total,
		order.CouponID, order.ShippingAddressID, order.Notes,
	).Scan(&order.CreatedAt, &order.UpdatedAt)
}

func (r *pgOrderRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	o := &domain.Order{}
	query := `SELECT id, user_id, guest_email, guest_phone, order_number, status, subtotal, discount_amount,
		shipping_cost, total, coupon_id, shipping_address_id, notes, created_at, updated_at
		FROM orders WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&o.ID, &o.UserID, &o.GuestEmail, &o.GuestPhone, &o.OrderNumber, &o.Status,
		&o.Subtotal, &o.DiscountAmount, &o.ShippingCost, &o.Total,
		&o.CouponID, &o.ShippingAddressID, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}

	items, _ := r.GetItems(ctx, id)
	o.Items = items
	return o, nil
}

func (r *pgOrderRepo) GetByOrderNumber(ctx context.Context, orderNumber string) (*domain.Order, error) {
	o := &domain.Order{}
	query := `SELECT id, user_id, guest_email, guest_phone, order_number, status, subtotal, discount_amount,
		shipping_cost, total, coupon_id, shipping_address_id, notes, created_at, updated_at
		FROM orders WHERE order_number = $1`
	err := r.pool.QueryRow(ctx, query, orderNumber).Scan(
		&o.ID, &o.UserID, &o.GuestEmail, &o.GuestPhone, &o.OrderNumber, &o.Status,
		&o.Subtotal, &o.DiscountAmount, &o.ShippingCost, &o.Total,
		&o.CouponID, &o.ShippingAddressID, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, err
	}
	items, _ := r.GetItems(ctx, o.ID)
	o.Items = items
	return o, nil
}

func (r *pgOrderRepo) Update(ctx context.Context, order *domain.Order) error {
	query := `UPDATE orders SET status=$1, notes=$2, updated_at=NOW() WHERE id=$3`
	_, err := r.pool.Exec(ctx, query, order.Status, order.Notes, order.ID)
	return err
}

func (r *pgOrderRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.OrderStatus) error {
	_, err := r.pool.Exec(ctx, `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, status, id)
	return err
}

func (r *pgOrderRepo) List(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int64, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.UserID != nil {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, *filter.UserID)
		argIdx++
	}
	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *filter.Status)
		argIdx++
	}
	if filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(order_number ILIKE $%d OR guest_email ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	var total int64
	err := r.pool.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM orders %s", whereClause), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	sortBy := "created_at"
	sortDir := "DESC"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}
	if filter.SortDir == "asc" {
		sortDir = "ASC"
	}

	query := fmt.Sprintf(`SELECT id, user_id, guest_email, guest_phone, order_number, status, subtotal,
		discount_amount, shipping_cost, total, coupon_id, shipping_address_id, notes, created_at, updated_at
		FROM orders %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		whereClause, sortBy, sortDir, argIdx, argIdx+1)
	args = append(args, filter.Limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.GuestEmail, &o.GuestPhone, &o.OrderNumber, &o.Status,
			&o.Subtotal, &o.DiscountAmount, &o.ShippingCost, &o.Total,
			&o.CouponID, &o.ShippingAddressID, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		orders = append(orders, o)
	}

	return orders, total, nil
}

func (r *pgOrderRepo) GetUserOrders(ctx context.Context, userID uuid.UUID, page, limit int) ([]domain.Order, int64, error) {
	return r.List(ctx, domain.OrderFilter{UserID: &userID, Page: page, Limit: limit})
}

func (r *pgOrderRepo) CreateItems(ctx context.Context, items []domain.OrderItem) error {
	for i := range items {
		items[i].ID = uuid.New()
		_, err := r.pool.Exec(ctx,
			`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, product_slug, image_url, variant_options, unit_price, quantity, total_price)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			items[i].ID, items[i].OrderID, items[i].ProductID, items[i].VariantID, items[i].ProductName,
			items[i].ProductSlug, items[i].ImageURL, items[i].VariantOptions, items[i].UnitPrice, items[i].Quantity, items[i].TotalPrice,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *pgOrderRepo) GetItems(ctx context.Context, orderID uuid.UUID) ([]domain.OrderItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, order_id, product_id, variant_id, product_name, product_slug, image_url, variant_options, unit_price, quantity, total_price
		FROM order_items WHERE order_id = $1`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.OrderItem
	for rows.Next() {
		var item domain.OrderItem
		var variantID uuid.NullUUID
		if err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &variantID, &item.ProductName,
			&item.ProductSlug, &item.ImageURL, &item.VariantOptions, &item.UnitPrice, &item.Quantity, &item.TotalPrice); err != nil {
			return nil, err
		}
		if variantID.Valid {
			u := variantID.UUID
			item.VariantID = &u
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *pgOrderRepo) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders`).Scan(&count)
	return count, err
}

func (r *pgOrderRepo) CountByStatus(ctx context.Context, status domain.OrderStatus) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM orders WHERE status = $1`, status).Scan(&count)
	return count, err
}

func (r *pgOrderRepo) GetTotalRevenue(ctx context.Context) (decimal.Decimal, error) {
	var rev decimal.Decimal
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('cancelled')`).Scan(&rev)
	return rev, err
}

func (r *pgOrderRepo) GetTodayRevenue(ctx context.Context) (decimal.Decimal, error) {
	var rev decimal.Decimal
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(total), 0) FROM orders WHERE status NOT IN ('cancelled') AND created_at >= CURRENT_DATE`).Scan(&rev)
	return rev, err
}

func (r *pgOrderRepo) GetRevenueByDay(ctx context.Context, days int) ([]domain.RevenueStat, error) {
	query := `SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
		FROM orders WHERE created_at >= $1 AND status NOT IN ('cancelled')
		GROUP BY DATE(created_at) ORDER BY date`
	since := time.Now().AddDate(0, 0, -days)
	rows, err := r.pool.Query(ctx, query, since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []domain.RevenueStat
	for rows.Next() {
		var s domain.RevenueStat
		var date time.Time
		if err := rows.Scan(&date, &s.Revenue, &s.Orders); err != nil {
			return nil, err
		}
		s.Date = date.Format("2006-01-02")
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *pgOrderRepo) GetRecentOrders(ctx context.Context, limit int) ([]domain.Order, error) {
	orders, _, err := r.List(ctx, domain.OrderFilter{Page: 1, Limit: limit})
	return orders, err
}
