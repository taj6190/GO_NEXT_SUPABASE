package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgCategoryRepo struct {
	pool *pgxpool.Pool
}

func NewCategoryRepository(pool *pgxpool.Pool) domain.CategoryRepository {
	return &pgCategoryRepo{pool: pool}
}

func (r *pgCategoryRepo) Create(ctx context.Context, category *domain.Category) error {
	category.ID = uuid.New()
	query := `INSERT INTO categories (id, name, slug, description, parent_id, image_url, sort_order, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING created_at`
	return r.pool.QueryRow(ctx, query,
		category.ID, category.Name, category.Slug, category.Description,
		category.ParentID, category.ImageURL, category.SortOrder, category.IsActive,
	).Scan(&category.CreatedAt)
}

func (r *pgCategoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	cat := &domain.Category{}
	query := `SELECT id, name, slug, COALESCE(description,''), parent_id, COALESCE(image_url,''), sort_order, is_active, created_at
		FROM categories WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.ParentID,
		&cat.ImageURL, &cat.SortOrder, &cat.IsActive, &cat.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("category not found")
	}
	return cat, err
}

func (r *pgCategoryRepo) GetBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	cat := &domain.Category{}
	query := `SELECT id, name, slug, COALESCE(description,''), parent_id, COALESCE(image_url,''), sort_order, is_active, created_at
		FROM categories WHERE slug = $1`
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.ParentID,
		&cat.ImageURL, &cat.SortOrder, &cat.IsActive, &cat.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("category not found")
	}
	return cat, err
}

func (r *pgCategoryRepo) Update(ctx context.Context, category *domain.Category) error {
	query := `UPDATE categories SET name=$1, slug=$2, description=$3, parent_id=$4, image_url=$5,
		sort_order=$6, is_active=$7 WHERE id=$8`
	_, err := r.pool.Exec(ctx, query,
		category.Name, category.Slug, category.Description, category.ParentID,
		category.ImageURL, category.SortOrder, category.IsActive, category.ID,
	)
	return err
}

func (r *pgCategoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	return err
}

func (r *pgCategoryRepo) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug, COALESCE(description,''), parent_id, COALESCE(image_url,''), sort_order, is_active, created_at
		FROM categories ORDER BY sort_order, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.ParentID,
			&c.ImageURL, &c.SortOrder, &c.IsActive, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *pgCategoryRepo) GetTree(ctx context.Context) ([]domain.Category, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	return buildTree(all, nil), nil
}

func (r *pgCategoryRepo) GetChildren(ctx context.Context, parentID uuid.UUID) ([]domain.Category, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, slug, COALESCE(description,''), parent_id, COALESCE(image_url,''), sort_order, is_active, created_at
		FROM categories WHERE parent_id = $1 ORDER BY sort_order, name`, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.ParentID,
			&c.ImageURL, &c.SortOrder, &c.IsActive, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func buildTree(categories []domain.Category, parentID *uuid.UUID) []domain.Category {
	var tree []domain.Category
	for _, cat := range categories {
		if (parentID == nil && cat.ParentID == nil) || (parentID != nil && cat.ParentID != nil && *cat.ParentID == *parentID) {
			children := buildTree(categories, &cat.ID)
			cat.Children = children
			tree = append(tree, cat)
		}
	}
	return tree
}
