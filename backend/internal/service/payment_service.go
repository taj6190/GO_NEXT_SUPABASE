package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type PaymentService struct {
	paymentRepo domain.PaymentRepository
	orderRepo   domain.OrderRepository
}

func NewPaymentService(paymentRepo domain.PaymentRepository, orderRepo domain.OrderRepository) *PaymentService {
	return &PaymentService{paymentRepo: paymentRepo, orderRepo: orderRepo}
}

func (s *PaymentService) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*domain.Payment, error) {
	return s.paymentRepo.GetByOrderID(ctx, orderID)
}

func (s *PaymentService) ProcessBkashCallback(ctx context.Context, paymentID string, status string, txnID string) error {
	id, err := uuid.Parse(paymentID)
	if err != nil {
		return fmt.Errorf("invalid payment ID")
	}

	payment, err := s.paymentRepo.GetByID(ctx, id)
	if err != nil || payment == nil {
		return fmt.Errorf("payment not found")
	}

	var paymentStatus domain.PaymentStatus
	if status == "success" {
		paymentStatus = domain.PaymentStatusCompleted
		_ = s.orderRepo.UpdateStatus(ctx, payment.OrderID, domain.OrderStatusConfirmed)
	} else {
		paymentStatus = domain.PaymentStatusFailed
	}

	return s.paymentRepo.UpdateStatus(ctx, id, paymentStatus, txnID)
}

func (s *PaymentService) ProcessNagadCallback(ctx context.Context, paymentID string, status string, txnID string) error {
	return s.ProcessBkashCallback(ctx, paymentID, status, txnID) // Same flow
}

func (s *PaymentService) InitiatePayment(ctx context.Context, orderID uuid.UUID, method domain.PaymentMethod) (map[string]interface{}, error) {
	payment, err := s.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil || payment == nil {
		return nil, fmt.Errorf("payment not found for this order")
	}

	switch method {
	case domain.PaymentMethodCOD:
		return map[string]interface{}{
			"method":  "cod",
			"status":  "pending",
			"message": "Cash on delivery selected. Pay when you receive your order.",
		}, nil

	case domain.PaymentMethodBkash:
		// In production, this would call bKash Tokenized Checkout API
		return map[string]interface{}{
			"method":      "bkash",
			"payment_id":  payment.ID.String(),
			"redirect_url": fmt.Sprintf("/api/v1/payments/bkash/mock?payment_id=%s", payment.ID.String()),
			"message":     "Redirecting to bKash...",
		}, nil

	case domain.PaymentMethodNagad:
		// In production, this would call Nagad Payment API
		return map[string]interface{}{
			"method":      "nagad",
			"payment_id":  payment.ID.String(),
			"redirect_url": fmt.Sprintf("/api/v1/payments/nagad/mock?payment_id=%s", payment.ID.String()),
			"message":     "Redirecting to Nagad...",
		}, nil

	default:
		return nil, fmt.Errorf("unsupported payment method")
	}
}

func (s *PaymentService) List(ctx context.Context, page, limit int) ([]domain.Payment, int64, error) {
	return s.paymentRepo.List(ctx, page, limit)
}
