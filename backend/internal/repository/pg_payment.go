package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgPaymentRepo struct {
	pool *pgxpool.Pool
}

func NewPaymentRepository(pool *pgxpool.Pool) domain.PaymentRepository {
	return &pgPaymentRepo{pool: pool}
}

func (r *pgPaymentRepo) Create(ctx context.Context, payment *domain.Payment) error {
	payment.ID = uuid.New()
	query := `INSERT INTO payments (id, order_id, method, status, amount, transaction_id, gateway_response)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING created_at`
	return r.pool.QueryRow(ctx, query,
		payment.ID, payment.OrderID, payment.Method, payment.Status, payment.Amount,
		payment.TransactionID, payment.GatewayResponse,
	).Scan(&payment.CreatedAt)
}

func (r *pgPaymentRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error) {
	p := &domain.Payment{}
	query := `SELECT id, order_id, method, status, amount, transaction_id, gateway_response, paid_at, created_at
		FROM payments WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.OrderID, &p.Method, &p.Status, &p.Amount, &p.TransactionID,
		&p.GatewayResponse, &p.PaidAt, &p.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return p, err
}

func (r *pgPaymentRepo) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*domain.Payment, error) {
	p := &domain.Payment{}
	query := `SELECT id, order_id, method, status, amount, transaction_id, gateway_response, paid_at, created_at
		FROM payments WHERE order_id = $1`
	err := r.pool.QueryRow(ctx, query, orderID).Scan(
		&p.ID, &p.OrderID, &p.Method, &p.Status, &p.Amount, &p.TransactionID,
		&p.GatewayResponse, &p.PaidAt, &p.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return p, err
}

func (r *pgPaymentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.PaymentStatus, txnID string) error {
	query := `UPDATE payments SET status = $1, transaction_id = $2`
	args := []interface{}{status, txnID}
	if status == domain.PaymentStatusCompleted {
		query += `, paid_at = NOW()`
	}
	query += ` WHERE id = $3`
	args = append(args, id)
	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

func (r *pgPaymentRepo) List(ctx context.Context, page, limit int) ([]domain.Payment, int64, error) {
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM payments`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx,
		`SELECT id, order_id, method, status, amount, transaction_id, gateway_response, paid_at, created_at
		FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var payments []domain.Payment
	for rows.Next() {
		var p domain.Payment
		if err := rows.Scan(&p.ID, &p.OrderID, &p.Method, &p.Status, &p.Amount,
			&p.TransactionID, &p.GatewayResponse, &p.PaidAt, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		payments = append(payments, p)
	}
	return payments, total, nil
}
