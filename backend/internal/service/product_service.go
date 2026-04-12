package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type ProductService struct {
	productRepo domain.ProductRepository
	rdb         *redis.Client
}

func NewProductService(productRepo domain.ProductRepository, rdb *redis.Client) *ProductService {
	return &ProductService{productRepo: productRepo, rdb: rdb}
}

func (s *ProductService) Create(ctx context.Context, input domain.CreateProductInput) (*domain.Product, error) {
	product := &domain.Product{
		CategoryID:       input.CategoryID,
		Name:             input.Name,
		Slug:             utils.GenerateSlug(input.Name),
		Description:      input.Description,
		ShortDescription: input.ShortDescription,
		Price:            input.Price,
		DiscountPrice:    input.DiscountPrice,
		StockQuantity:    input.StockQuantity,
		SKU:              input.SKU,
		IsActive:         input.IsActive,
		IsFeatured:       input.IsFeatured,
		Weight:           input.Weight,
		Attributes:       input.Attributes,
	}

	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	// Add images
	for i, url := range input.ImageURLs {
		img := &domain.ProductImage{
			ProductID: product.ID,
			ImageURL:  url,
			IsPrimary: i == 0,
			SortOrder: i,
		}
		if err := s.productRepo.AddImage(ctx, img); err != nil {
			return nil, fmt.Errorf("failed to add product image: %w", err)
		}
	}

	// Create option groups and values
	optionValueMap := make(map[string]uuid.UUID) // temp key -> value ID for variant linking
	for i, ogInput := range input.OptionGroups {
		og := &domain.OptionGroup{
			ProductID: product.ID,
			Name:      ogInput.Name,
			SortOrder: i,
		}
		if err := s.productRepo.CreateOptionGroup(ctx, og); err != nil {
			return nil, fmt.Errorf("failed to create option group: %w", err)
		}
		for j, ovInput := range ogInput.Values {
			ov := &domain.OptionValue{
				OptionGroupID: og.ID,
				Value:         ovInput.Value,
				ColorHex:      ovInput.ColorHex,
				SortOrder:     j,
			}
			if err := s.productRepo.CreateOptionValue(ctx, ov); err != nil {
				return nil, fmt.Errorf("failed to create option value: %w", err)
			}
			optionValueMap[ov.Value] = ov.ID
		}
	}

	// Create variants
	for i, vInput := range input.Variants {
		v := &domain.Variant{
			ProductID:     product.ID,
			SKU:           vInput.SKU,
			Price:         vInput.Price,
			DiscountPrice: vInput.DiscountPrice,
			StockQuantity: vInput.StockQuantity,
			Weight:        vInput.Weight,
			IsActive:      vInput.IsActive,
			SortOrder:     i,
		}
		if err := s.productRepo.CreateVariant(ctx, v); err != nil {
			return nil, fmt.Errorf("failed to create variant: %w", err)
		}

		// Link variant to option values
		for _, ovID := range vInput.OptionValues {
			vo := &domain.VariantOption{
				VariantID:     v.ID,
				OptionValueID: ovID,
			}
			// We need to find the option group for this value
			// Look it up from the database
			vo.OptionGroupID = s.findGroupForValue(ctx, product.ID, ovID)
			if err := s.productRepo.CreateVariantOption(ctx, vo); err != nil {
				return nil, fmt.Errorf("failed to create variant option: %w", err)
			}
		}

		// Add variant images
		for j, imgURL := range vInput.ImageURLs {
			img := &domain.VariantImage{
				VariantID: v.ID,
				ImageURL:  imgURL,
				IsPrimary: j == 0,
				SortOrder: j,
			}
			if err := s.productRepo.AddVariantImage(ctx, img); err != nil {
				return nil, fmt.Errorf("failed to add variant image: %w", err)
			}
		}
	}

	s.invalidateCache(ctx)
	return s.productRepo.GetByID(ctx, product.ID)
}

func (s *ProductService) findGroupForValue(ctx context.Context, productID uuid.UUID, valueID uuid.UUID) uuid.UUID {
	groups, _ := s.productRepo.GetOptionGroups(ctx, productID)
	for _, g := range groups {
		for _, v := range g.Values {
			if v.ID == valueID {
				return g.ID
			}
		}
	}
	return uuid.Nil
}

func (s *ProductService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	return s.productRepo.GetByID(ctx, id)
}

func (s *ProductService) GetBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	// Try cache first
	if s.rdb != nil {
		cacheKey := fmt.Sprintf("products:detail:%s", slug)
		cached, err := s.rdb.Get(ctx, cacheKey).Result()
		if err == nil {
			var p domain.Product
			if json.Unmarshal([]byte(cached), &p) == nil {
				return &p, nil
			}
		}
	}

	p, err := s.productRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	// Cache the result
	if s.rdb != nil && p != nil {
		data, _ := json.Marshal(p)
		s.rdb.Set(ctx, fmt.Sprintf("products:detail:%s", slug), data, 10*time.Minute)
	}

	return p, nil
}

func (s *ProductService) Update(ctx context.Context, id uuid.UUID, input domain.UpdateProductInput) (*domain.Product, error) {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.CategoryID != nil {
		product.CategoryID = *input.CategoryID
	}
	if input.Name != "" {
		product.Name = input.Name
		product.Slug = utils.GenerateSlug(input.Name)
	}
	if input.Description != "" {
		product.Description = input.Description
	}
	if input.ShortDescription != "" {
		product.ShortDescription = input.ShortDescription
	}
	if input.Price != nil {
		product.Price = *input.Price
	}
	if input.DiscountPrice != nil {
		product.DiscountPrice = *input.DiscountPrice
	}
	if input.StockQuantity != nil {
		product.StockQuantity = *input.StockQuantity
	}
	if input.SKU != "" {
		product.SKU = input.SKU
	}
	if input.IsActive != nil {
		product.IsActive = *input.IsActive
	}
	if input.IsFeatured != nil {
		product.IsFeatured = *input.IsFeatured
	}
	if input.Weight != nil {
		product.Weight = *input.Weight
	}
	if input.Attributes != nil {
		product.Attributes = input.Attributes
	}

	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, err
	}

	// Update images if provided
	if len(input.ImageURLs) > 0 {
		_ = s.productRepo.DeleteImagesByProductID(ctx, id)
		for i, url := range input.ImageURLs {
			img := &domain.ProductImage{
				ProductID: id,
				ImageURL:  url,
				IsPrimary: i == 0,
				SortOrder: i,
			}
			s.productRepo.AddImage(ctx, img)
		}
	}

	// Update option groups and variants if provided
	if len(input.OptionGroups) > 0 {
		_ = s.productRepo.DeleteVariantsByProductID(ctx, id)
		_ = s.productRepo.DeleteOptionGroupsByProductID(ctx, id)

		for i, ogInput := range input.OptionGroups {
			og := &domain.OptionGroup{
				ProductID: id,
				Name:      ogInput.Name,
				SortOrder: i,
			}
			if err := s.productRepo.CreateOptionGroup(ctx, og); err != nil {
				continue
			}
			for j, ovInput := range ogInput.Values {
				ov := &domain.OptionValue{
					OptionGroupID: og.ID,
					Value:         ovInput.Value,
					ColorHex:      ovInput.ColorHex,
					SortOrder:     j,
				}
				s.productRepo.CreateOptionValue(ctx, ov)
			}
		}
	}

	if len(input.Variants) > 0 {
		_ = s.productRepo.DeleteVariantsByProductID(ctx, id)
		for i, vInput := range input.Variants {
			v := &domain.Variant{
				ProductID:     id,
				SKU:           vInput.SKU,
				Price:         vInput.Price,
				DiscountPrice: vInput.DiscountPrice,
				StockQuantity: vInput.StockQuantity,
				Weight:        vInput.Weight,
				IsActive:      vInput.IsActive,
				SortOrder:     i,
			}
			if err := s.productRepo.CreateVariant(ctx, v); err != nil {
				continue
			}
			for _, ovID := range vInput.OptionValues {
				vo := &domain.VariantOption{
					VariantID:     v.ID,
					OptionValueID: ovID,
					OptionGroupID: s.findGroupForValue(ctx, id, ovID),
				}
				s.productRepo.CreateVariantOption(ctx, vo)
			}
			for j, imgURL := range vInput.ImageURLs {
				img := &domain.VariantImage{
					VariantID: v.ID,
					ImageURL:  imgURL,
					IsPrimary: j == 0,
					SortOrder: j,
				}
				s.productRepo.AddVariantImage(ctx, img)
			}
		}
	}

	s.invalidateCache(ctx)
	return s.productRepo.GetByID(ctx, id)
}

func (s *ProductService) Delete(ctx context.Context, id uuid.UUID) error {
	err := s.productRepo.Delete(ctx, id)
	if err == nil {
		s.invalidateCache(ctx)
	}
	return err
}

func (s *ProductService) List(ctx context.Context, filter domain.ProductFilter) ([]domain.Product, int64, error) {
	return s.productRepo.List(ctx, filter)
}

func (s *ProductService) GetFeatured(ctx context.Context, limit int) ([]domain.Product, error) {
	if s.rdb != nil {
		cached, err := s.rdb.Get(ctx, "products:featured").Result()
		if err == nil {
			var products []domain.Product
			if json.Unmarshal([]byte(cached), &products) == nil {
				return products, nil
			}
		}
	}

	products, err := s.productRepo.GetFeatured(ctx, limit)
	if err != nil {
		return nil, err
	}

	if s.rdb != nil {
		data, _ := json.Marshal(products)
		s.rdb.Set(ctx, "products:featured", data, 10*time.Minute)
	}

	return products, nil
}

func (s *ProductService) GetRelated(ctx context.Context, productID uuid.UUID, categoryID uuid.UUID, limit int) ([]domain.Product, error) {
	return s.productRepo.GetRelated(ctx, productID, categoryID, limit)
}

func (s *ProductService) invalidateCache(ctx context.Context) {
	if s.rdb == nil {
		return
	}
	keys, _ := s.rdb.Keys(ctx, "products:*").Result()
	if len(keys) > 0 {
		s.rdb.Del(ctx, keys...)
	}
}
