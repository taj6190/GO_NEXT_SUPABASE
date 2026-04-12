package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type PaymentMethod string
type PaymentStatus string

const (
	PaymentMethodCOD   PaymentMethod = "cod"
	PaymentMethodBkash PaymentMethod = "bkash"
	PaymentMethodNagad PaymentMethod = "nagad"

	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID              uuid.UUID       `json:"id"`
	OrderID         uuid.UUID       `json:"order_id"`
	Method          PaymentMethod   `json:"method"`
	Status          PaymentStatus   `json:"status"`
	Amount          decimal.Decimal `json:"amount"`
	TransactionID   string          `json:"transaction_id"`
	GatewayResponse JSON            `json:"gateway_response"`
	PaidAt          *time.Time      `json:"paid_at"`
	CreatedAt       time.Time       `json:"created_at"`
}

type InitiatePaymentInput struct {
	OrderID uuid.UUID     `json:"order_id" binding:"required"`
	Method  PaymentMethod `json:"method" binding:"required"`
}

type PaymentRepository interface {
	Create(ctx context.Context, payment *Payment) error
	GetByID(ctx context.Context, id uuid.UUID) (*Payment, error)
	GetByOrderID(ctx context.Context, orderID uuid.UUID) (*Payment, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status PaymentStatus, txnID string) error
	List(ctx context.Context, page, limit int) ([]Payment, int64, error)
}
