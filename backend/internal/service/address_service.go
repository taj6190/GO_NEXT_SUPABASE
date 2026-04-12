package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type AddressService struct {
	addressRepo domain.AddressRepository
}

func NewAddressService(addressRepo domain.AddressRepository) *AddressService {
	return &AddressService{addressRepo: addressRepo}
}

func (s *AddressService) Create(ctx context.Context, userID *uuid.UUID, sessionID string, input domain.CreateAddressInput) (*domain.Address, error) {
	addr := &domain.Address{
		UserID:         userID,
		GuestSessionID: sessionID,
		FullName:       input.FullName,
		Phone:          input.Phone,
		AddressLine1:   input.AddressLine1,
		AddressLine2:   input.AddressLine2,
		City:           input.City,
		District:       input.District,
		PostalCode:     input.PostalCode,
		IsDefault:      input.IsDefault,
	}
	err := s.addressRepo.Create(ctx, addr)
	return addr, err
}

func (s *AddressService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Address, error) {
	return s.addressRepo.GetByID(ctx, id)
}

func (s *AddressService) Update(ctx context.Context, id uuid.UUID, input domain.CreateAddressInput) (*domain.Address, error) {
	addr, err := s.addressRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	addr.FullName = input.FullName
	addr.Phone = input.Phone
	addr.AddressLine1 = input.AddressLine1
	addr.AddressLine2 = input.AddressLine2
	addr.City = input.City
	addr.District = input.District
	addr.PostalCode = input.PostalCode
	addr.IsDefault = input.IsDefault
	err = s.addressRepo.Update(ctx, addr)
	return addr, err
}

func (s *AddressService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.addressRepo.Delete(ctx, id)
}

func (s *AddressService) GetUserAddresses(ctx context.Context, userID uuid.UUID) ([]domain.Address, error) {
	return s.addressRepo.GetUserAddresses(ctx, userID)
}

func (s *AddressService) SetDefault(ctx context.Context, userID uuid.UUID, addressID uuid.UUID) error {
	return s.addressRepo.SetDefault(ctx, userID, addressID)
}
