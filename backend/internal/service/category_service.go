package service

import (
	"context"
	"fmt"
	"time"

	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type CategoryService struct {
	categoryRepo domain.CategoryRepository
	cache        *utils.CacheManager
}

func NewCategoryService(categoryRepo domain.CategoryRepository, rdb *redis.Client) *CategoryService {
	return &CategoryService{
		categoryRepo: categoryRepo,
		cache:        utils.NewCacheManager(rdb),
	}
}

func (s *CategoryService) Create(ctx context.Context, input domain.CreateCategoryInput) (*domain.Category, error) {
	cat := &domain.Category{
		Name:        input.Name,
		Slug:        utils.GenerateSlug(input.Name),
		Description: input.Description,
		ParentID:    input.ParentID,
		ImageURL:    input.ImageURL,
		SortOrder:   input.SortOrder,
		IsActive:    input.IsActive,
	}

	if err := s.categoryRepo.Create(ctx, cat); err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	s.invalidateCache(ctx)
	return cat, nil
}

func (s *CategoryService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	return s.categoryRepo.GetByID(ctx, id)
}

func (s *CategoryService) GetBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	return s.categoryRepo.GetBySlug(ctx, slug)
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, input domain.UpdateCategoryInput) (*domain.Category, error) {
	cat, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.Name != "" {
		cat.Name = input.Name
		cat.Slug = utils.GenerateSlug(input.Name)
	}
	if input.Description != "" {
		cat.Description = input.Description
	}
	if input.ParentID != nil {
		cat.ParentID = input.ParentID
	}
	if input.ImageURL != "" {
		cat.ImageURL = input.ImageURL
	}
	if input.SortOrder != nil {
		cat.SortOrder = *input.SortOrder
	}
	if input.IsActive != nil {
		cat.IsActive = *input.IsActive
	}

	if err := s.categoryRepo.Update(ctx, cat); err != nil {
		return nil, err
	}

	s.invalidateCache(ctx)
	return cat, nil
}

func (s *CategoryService) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.categoryRepo.Delete(ctx, id)
	if err == nil {
		s.invalidateCache(ctx)
	}
	return err
}

func (s *CategoryService) GetTree(ctx context.Context) ([]domain.Category, error) {
	// Try cache first
	var cachedCats []domain.Category
	if err := s.cache.Get(ctx, "categories:tree", &cachedCats); err == nil {
		return cachedCats, nil
	}

	cats, err := s.categoryRepo.GetTree(ctx)
	if err != nil {
		return nil, err
	}

	// Cache for 30 minutes
	_ = s.cache.Set(ctx, "categories:tree", cats, 30*time.Minute)

	return cats, nil
}

func (s *CategoryService) List(ctx context.Context) ([]domain.Category, error) {
	return s.categoryRepo.List(ctx)
}

func (s *CategoryService) invalidateCache(ctx context.Context) {
	_ = s.cache.Delete(ctx, "categories:tree")
}
