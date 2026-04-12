package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type UserService struct {
	userRepo domain.UserRepository
}

func NewUserService(userRepo domain.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

func (s *UserService) UpdateProfile(ctx context.Context, id uuid.UUID, input domain.UpdateUserInput) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) AdminUpdateUser(ctx context.Context, id uuid.UUID, input domain.UpdateUserInput) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.FullName != "" {
		user.FullName = input.FullName
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}
	if input.Role != "" {
		user.Role = input.Role
	}
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) List(ctx context.Context, page, limit int, search string) ([]domain.User, int64, error) {
	return s.userRepo.List(ctx, page, limit, search)
}
