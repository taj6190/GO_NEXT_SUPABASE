package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/config"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type AuthService struct {
	userRepo domain.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo domain.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg}
}

func (s *AuthService) Register(ctx context.Context, input domain.RegisterInput) (*domain.User, *utils.TokenPair, error) {
	existing, _ := s.userRepo.GetByEmail(ctx, input.Email)
	if existing != nil {
		return nil, nil, fmt.Errorf("email already registered")
	}

	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password")
	}

	user := &domain.User{
		Email:        input.Email,
		PasswordHash: hash,
		FullName:     input.FullName,
		Phone:        input.Phone,
		Role:         domain.RoleUser,
		IsActive:     true,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	tokens, err := utils.GenerateTokenPair(user.ID, user.Email, string(user.Role), s.cfg.JWTSecret, s.cfg.JWTExpiry, s.cfg.JWTRefreshExpiry)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens")
	}

	return user, tokens, nil
}

func (s *AuthService) Login(ctx context.Context, input domain.LoginInput) (*domain.User, *utils.TokenPair, error) {
	user, err := s.userRepo.GetByEmail(ctx, input.Email)
	if err != nil || user == nil {
		return nil, nil, fmt.Errorf("invalid email or password")
	}

	if !user.IsActive {
		return nil, nil, fmt.Errorf("account is deactivated")
	}

	if !utils.CheckPassword(input.Password, user.PasswordHash) {
		return nil, nil, fmt.Errorf("invalid email or password")
	}

	tokens, err := utils.GenerateTokenPair(user.ID, user.Email, string(user.Role), s.cfg.JWTSecret, s.cfg.JWTExpiry, s.cfg.JWTRefreshExpiry)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens")
	}

	return user, tokens, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshTokenStr string) (*utils.TokenPair, error) {
	claims, err := utils.ValidateToken(refreshTokenStr, s.cfg.JWTSecret)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	if claims.Type != utils.RefreshToken {
		return nil, fmt.Errorf("invalid token type")
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}

	tokens, err := utils.GenerateTokenPair(user.ID, user.Email, string(user.Role), s.cfg.JWTSecret, s.cfg.JWTExpiry, s.cfg.JWTRefreshExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens")
	}

	return tokens, nil
}

func (s *AuthService) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}
