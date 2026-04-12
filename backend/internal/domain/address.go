package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Address struct {
	ID             uuid.UUID `json:"id"`
	UserID         *uuid.UUID `json:"user_id"`
	GuestSessionID string    `json:"guest_session_id,omitempty"`
	FullName       string    `json:"full_name"`
	Phone          string    `json:"phone"`
	AddressLine1   string    `json:"address_line1"`
	AddressLine2   string    `json:"address_line2"`
	City           string    `json:"city"`
	District       string    `json:"district"`
	PostalCode     string    `json:"postal_code"`
	IsDefault      bool      `json:"is_default"`
	CreatedAt      time.Time `json:"created_at"`
}

type CreateAddressInput struct {
	FullName     string `json:"full_name" binding:"required"`
	Phone        string `json:"phone" binding:"required"`
	AddressLine1 string `json:"address_line1" binding:"required"`
	AddressLine2 string `json:"address_line2"`
	City         string `json:"city" binding:"required"`
	District     string `json:"district" binding:"required"`
	PostalCode   string `json:"postal_code"`
	IsDefault    bool   `json:"is_default"`
}

type AddressRepository interface {
	Create(ctx context.Context, address *Address) error
	GetByID(ctx context.Context, id uuid.UUID) (*Address, error)
	Update(ctx context.Context, address *Address) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetUserAddresses(ctx context.Context, userID uuid.UUID) ([]Address, error)
	SetDefault(ctx context.Context, userID uuid.UUID, addressID uuid.UUID) error
}
