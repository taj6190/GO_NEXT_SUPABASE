package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Description string     `json:"description"`
	ParentID    *uuid.UUID `json:"parent_id"`
	ImageURL    string     `json:"image_url"`
	SortOrder   int        `json:"sort_order"`
	IsActive    bool       `json:"is_active"`
	Children    []Category `json:"children,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateCategoryInput struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	ParentID    *uuid.UUID `json:"parent_id"`
	ImageURL    string     `json:"image_url"`
	SortOrder   int        `json:"sort_order"`
	IsActive    bool       `json:"is_active"`
}

type UpdateCategoryInput struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	ParentID    *uuid.UUID `json:"parent_id"`
	ImageURL    string     `json:"image_url"`
	SortOrder   *int       `json:"sort_order"`
	IsActive    *bool      `json:"is_active"`
}

type CategoryRepository interface {
	Create(ctx context.Context, category *Category) error
	GetByID(ctx context.Context, id uuid.UUID) (*Category, error)
	GetBySlug(ctx context.Context, slug string) (*Category, error)
	Update(ctx context.Context, category *Category) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context) ([]Category, error)
	GetTree(ctx context.Context) ([]Category, error)
	GetChildren(ctx context.Context, parentID uuid.UUID) ([]Category, error)
}
