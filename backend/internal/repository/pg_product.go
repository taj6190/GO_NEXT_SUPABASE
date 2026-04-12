package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/shopspring/decimal"
)

type pgProductRepo struct {
	pool *pgxpool.Pool
}

func NewProductRepository(pool *pgxpool.Pool) domain.ProductRepository {
	return &pgProductRepo{pool: pool}
}

func (r *pgProductRepo) Create(ctx context.Context, product *domain.Product) error {
	product.ID = uuid.New()
	query := `INSERT INTO products (id, category_id, name, slug, description, short_description, price, discount_price, stock_quantity, sku, is_active, is_featured, weight, attributes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at, updated_at`
	return r.pool.QueryRow(ctx, query,
		product.ID, product.CategoryID, product.Name, product.Slug, product.Description,
		product.ShortDescription, product.Price, product.DiscountPrice, product.StockQuantity,
		product.SKU, product.IsActive, product.IsFeatured, product.Weight, product.Attributes,
	).Scan(&product.CreatedAt, &product.UpdatedAt)
}

func (r *pgProductRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	p := &domain.Product{}
	query := `SELECT p.id, p.category_id, COALESCE(c.name,''), p.name, p.slug, COALESCE(p.description,''), COALESCE(p.short_description,''),
		p.price, COALESCE(p.discount_price, 0), p.stock_quantity, p.sku, p.is_active, p.is_featured, COALESCE(p.weight, 0), COALESCE(p.attributes, '{}'),
		COALESCE(p.average_rating, 0), COALESCE(p.review_count, 0),
		p.created_at, p.updated_at
		FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Slug, &p.Description, &p.ShortDescription,
		&p.Price, &p.DiscountPrice, &p.StockQuantity, &p.SKU, &p.IsActive, &p.IsFeatured,
		&p.Weight, &p.Attributes, &p.AverageRating, &p.ReviewCount, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, err
	}

	images, _ := r.GetImages(ctx, id)
	p.Images = images

	optionGroups, _ := r.GetOptionGroups(ctx, id)
	p.OptionGroups = optionGroups

	variants, _ := r.GetVariants(ctx, id)
	p.Variants = variants

	return p, nil
}

func (r *pgProductRepo) GetBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	p := &domain.Product{}
	query := `SELECT p.id, p.category_id, COALESCE(c.name,''), p.name, p.slug, COALESCE(p.description,''), COALESCE(p.short_description,''),
		p.price, COALESCE(p.discount_price, 0), p.stock_quantity, p.sku, p.is_active, p.is_featured, COALESCE(p.weight, 0), COALESCE(p.attributes, '{}'),
		COALESCE(p.average_rating, 0), COALESCE(p.review_count, 0),
		p.created_at, p.updated_at
		FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = $1`
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Slug, &p.Description, &p.ShortDescription,
		&p.Price, &p.DiscountPrice, &p.StockQuantity, &p.SKU, &p.IsActive, &p.IsFeatured,
		&p.Weight, &p.Attributes, &p.AverageRating, &p.ReviewCount, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, err
	}

	images, _ := r.GetImages(ctx, p.ID)
	p.Images = images

	optionGroups, _ := r.GetOptionGroups(ctx, p.ID)
	p.OptionGroups = optionGroups

	variants, _ := r.GetVariants(ctx, p.ID)
	p.Variants = variants

	return p, nil
}

func (r *pgProductRepo) Update(ctx context.Context, product *domain.Product) error {
	query := `UPDATE products SET category_id=$1, name=$2, slug=$3, description=$4, short_description=$5,
		price=$6, discount_price=$7, stock_quantity=$8, sku=$9, is_active=$10, is_featured=$11,
		weight=$12, attributes=$13, updated_at=NOW() WHERE id=$14`
	_, err := r.pool.Exec(ctx, query,
		product.CategoryID, product.Name, product.Slug, product.Description, product.ShortDescription,
		product.Price, product.DiscountPrice, product.StockQuantity, product.SKU, product.IsActive,
		product.IsFeatured, product.Weight, product.Attributes, product.ID,
	)
	return err
}

func (r *pgProductRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *pgProductRepo) List(ctx context.Context, filter domain.ProductFilter) ([]domain.Product, int64, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf("p.category_id = $%d", argIdx))
		args = append(args, *filter.CategoryID)
		argIdx++
	}
	if filter.IsActive != nil {
		conditions = append(conditions, fmt.Sprintf("p.is_active = $%d", argIdx))
		args = append(args, *filter.IsActive)
		argIdx++
	}
	if filter.IsFeatured != nil {
		conditions = append(conditions, fmt.Sprintf("p.is_featured = $%d", argIdx))
		args = append(args, *filter.IsFeatured)
		argIdx++
	}
	if filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(p.name ILIKE $%d OR p.description ILIKE $%d OR p.sku ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.MinPrice != nil {
		conditions = append(conditions, fmt.Sprintf("p.price >= $%d", argIdx))
		args = append(args, *filter.MinPrice)
		argIdx++
	}
	if filter.MaxPrice != nil {
		conditions = append(conditions, fmt.Sprintf("p.price <= $%d", argIdx))
		args = append(args, *filter.MaxPrice)
		argIdx++
	}
	if filter.MinRating != nil {
		conditions = append(conditions, fmt.Sprintf("COALESCE(p.average_rating, 0) >= $%d", argIdx))
		args = append(args, *filter.MinRating)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	var total int64
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM products p %s", whereClause)
	err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Sort
	sortBy := "p.created_at"
	sortOrder := "DESC"
	switch filter.SortBy {
	case "name":
		sortBy = "p.name"
	case "price":
		sortBy = "p.price"
	case "created_at":
		sortBy = "p.created_at"
	case "rating":
		sortBy = "COALESCE(p.average_rating, 0)"
	case "popularity":
		sortBy = "COALESCE(p.review_count, 0)"
	}
	if filter.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	offset := (filter.Page - 1) * filter.Limit
	dataQ := fmt.Sprintf(`SELECT p.id, p.category_id, COALESCE(c.name,''), p.name, p.slug, COALESCE(p.description,''), COALESCE(p.short_description,''),
		p.price, COALESCE(p.discount_price, 0), p.stock_quantity, p.sku, p.is_active, p.is_featured, COALESCE(p.weight, 0), COALESCE(p.attributes, '{}'),
		COALESCE(p.average_rating, 0), COALESCE(p.review_count, 0),
		p.created_at, p.updated_at,
		COALESCE((SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1), '') as primary_image
		FROM products p LEFT JOIN categories c ON p.category_id = c.id %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		whereClause, sortBy, sortOrder, argIdx, argIdx+1)
	args = append(args, filter.Limit, offset)

	rows, err := r.pool.Query(ctx, dataQ, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		var primaryImage string
		if err := rows.Scan(
			&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Slug, &p.Description, &p.ShortDescription,
			&p.Price, &p.DiscountPrice, &p.StockQuantity, &p.SKU, &p.IsActive, &p.IsFeatured,
			&p.Weight, &p.Attributes, &p.AverageRating, &p.ReviewCount,
			&p.CreatedAt, &p.UpdatedAt, &primaryImage,
		); err != nil {
			return nil, 0, err
		}
		if primaryImage != "" {
			p.Images = []domain.ProductImage{{ImageURL: primaryImage, IsPrimary: true}}
		}
		products = append(products, p)
	}

	return products, total, nil
}

func (r *pgProductRepo) GetFeatured(ctx context.Context, limit int) ([]domain.Product, error) {
	isActive := true
	isFeatured := true
	products, _, err := r.List(ctx, domain.ProductFilter{
		IsActive:   &isActive,
		IsFeatured: &isFeatured,
		Page:       1,
		Limit:      limit,
		SortBy:     "created_at",
		SortOrder:  "desc",
	})
	return products, err
}

func (r *pgProductRepo) GetRelated(ctx context.Context, productID uuid.UUID, categoryID uuid.UUID, limit int) ([]domain.Product, error) {
	isActive := true
	products, _, err := r.List(ctx, domain.ProductFilter{
		CategoryID: &categoryID,
		IsActive:   &isActive,
		Page:       1,
		Limit:      limit + 1,
		SortBy:     "rating",
		SortOrder:  "desc",
	})
	if err != nil {
		return nil, err
	}
	// Exclude the product itself
	var related []domain.Product
	for _, p := range products {
		if p.ID != productID && len(related) < limit {
			related = append(related, p)
		}
	}
	return related, nil
}

func (r *pgProductRepo) UpdateStock(ctx context.Context, id uuid.UUID, quantity int) error {
	_, err := r.pool.Exec(ctx, `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2`, quantity, id)
	return err
}

// ---- Images ----

func (r *pgProductRepo) AddImage(ctx context.Context, image *domain.ProductImage) error {
	image.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order)
		VALUES ($1, $2, $3, $4, $5)`, image.ID, image.ProductID, image.ImageURL, image.IsPrimary, image.SortOrder)
	return err
}

func (r *pgProductRepo) DeleteImage(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM product_images WHERE id = $1`, id)
	return err
}

func (r *pgProductRepo) GetImages(ctx context.Context, productID uuid.UUID) ([]domain.ProductImage, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, product_id, image_url, is_primary, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []domain.ProductImage
	for rows.Next() {
		var img domain.ProductImage
		if err := rows.Scan(&img.ID, &img.ProductID, &img.ImageURL, &img.IsPrimary, &img.SortOrder); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	return images, nil
}

func (r *pgProductRepo) DeleteImagesByProductID(ctx context.Context, productID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM product_images WHERE product_id = $1`, productID)
	return err
}

// ---- Option Groups ----

func (r *pgProductRepo) CreateOptionGroup(ctx context.Context, og *domain.OptionGroup) error {
	og.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_option_groups (id, product_id, name, sort_order)
		VALUES ($1, $2, $3, $4)`, og.ID, og.ProductID, og.Name, og.SortOrder)
	return err
}

func (r *pgProductRepo) GetOptionGroups(ctx context.Context, productID uuid.UUID) ([]domain.OptionGroup, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, product_id, name, sort_order, created_at FROM product_option_groups WHERE product_id = $1 ORDER BY sort_order`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []domain.OptionGroup
	for rows.Next() {
		var g domain.OptionGroup
		if err := rows.Scan(&g.ID, &g.ProductID, &g.Name, &g.SortOrder, &g.CreatedAt); err != nil {
			return nil, err
		}
		// Get values for this group
		values, _ := r.getOptionValues(ctx, g.ID)
		g.Values = values
		groups = append(groups, g)
	}
	return groups, nil
}

func (r *pgProductRepo) getOptionValues(ctx context.Context, groupID uuid.UUID) ([]domain.OptionValue, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, option_group_id, value, COALESCE(color_hex,''), sort_order FROM product_option_values WHERE option_group_id = $1 ORDER BY sort_order`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var values []domain.OptionValue
	for rows.Next() {
		var v domain.OptionValue
		if err := rows.Scan(&v.ID, &v.OptionGroupID, &v.Value, &v.ColorHex, &v.SortOrder); err != nil {
			return nil, err
		}
		values = append(values, v)
	}
	return values, nil
}

func (r *pgProductRepo) DeleteOptionGroupsByProductID(ctx context.Context, productID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM product_option_groups WHERE product_id = $1`, productID)
	return err
}

func (r *pgProductRepo) CreateOptionValue(ctx context.Context, ov *domain.OptionValue) error {
	ov.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_option_values (id, option_group_id, value, color_hex, sort_order)
		VALUES ($1, $2, $3, $4, $5)`, ov.ID, ov.OptionGroupID, ov.Value, ov.ColorHex, ov.SortOrder)
	return err
}

// ---- Variants ----

func (r *pgProductRepo) CreateVariant(ctx context.Context, v *domain.Variant) error {
	v.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_variants (id, product_id, sku, price, discount_price, stock_quantity, weight, is_active, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		v.ID, v.ProductID, v.SKU, v.Price, v.DiscountPrice, v.StockQuantity, v.Weight, v.IsActive, v.SortOrder)
	return err
}

func (r *pgProductRepo) GetVariants(ctx context.Context, productID uuid.UUID) ([]domain.Variant, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, product_id, sku, price, discount_price, stock_quantity, weight, is_active, sort_order, created_at
		FROM product_variants WHERE product_id = $1 ORDER BY sort_order`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var variants []domain.Variant
	for rows.Next() {
		var v domain.Variant
		if err := rows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.Price, &v.DiscountPrice, &v.StockQuantity, &v.Weight, &v.IsActive, &v.SortOrder, &v.CreatedAt); err != nil {
			return nil, err
		}
		options, _ := r.GetVariantOptions(ctx, v.ID)
		v.Options = options
		images, _ := r.GetVariantImages(ctx, v.ID)
		v.Images = images
		variants = append(variants, v)
	}
	return variants, nil
}

func (r *pgProductRepo) GetVariantByID(ctx context.Context, id uuid.UUID) (*domain.Variant, error) {
	v := &domain.Variant{}
	err := r.pool.QueryRow(ctx, `SELECT id, product_id, sku, price, discount_price, stock_quantity, weight, is_active, sort_order, created_at
		FROM product_variants WHERE id = $1`, id).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.Price, &v.DiscountPrice, &v.StockQuantity, &v.Weight, &v.IsActive, &v.SortOrder, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	options, _ := r.GetVariantOptions(ctx, v.ID)
	v.Options = options
	images, _ := r.GetVariantImages(ctx, v.ID)
	v.Images = images
	return v, nil
}

func (r *pgProductRepo) DeleteVariantsByProductID(ctx context.Context, productID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM product_variants WHERE product_id = $1`, productID)
	return err
}

func (r *pgProductRepo) CreateVariantOption(ctx context.Context, vo *domain.VariantOption) error {
	vo.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_variant_options (id, variant_id, option_group_id, option_value_id)
		VALUES ($1, $2, $3, $4)`, vo.ID, vo.VariantID, vo.OptionGroupID, vo.OptionValueID)
	return err
}

func (r *pgProductRepo) GetVariantOptions(ctx context.Context, variantID uuid.UUID) ([]domain.VariantOption, error) {
	rows, err := r.pool.Query(ctx, `SELECT vo.id, vo.variant_id, vo.option_group_id, vo.option_value_id,
		COALESCE(og.name,''), COALESCE(ov.value,'')
		FROM product_variant_options vo
		LEFT JOIN product_option_groups og ON vo.option_group_id = og.id
		LEFT JOIN product_option_values ov ON vo.option_value_id = ov.id
		WHERE vo.variant_id = $1`, variantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var options []domain.VariantOption
	for rows.Next() {
		var o domain.VariantOption
		if err := rows.Scan(&o.ID, &o.VariantID, &o.OptionGroupID, &o.OptionValueID, &o.GroupName, &o.ValueName); err != nil {
			return nil, err
		}
		options = append(options, o)
	}
	return options, nil
}

func (r *pgProductRepo) AddVariantImage(ctx context.Context, img *domain.VariantImage) error {
	img.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `INSERT INTO product_variant_images (id, variant_id, image_url, is_primary, sort_order)
		VALUES ($1, $2, $3, $4, $5)`, img.ID, img.VariantID, img.ImageURL, img.IsPrimary, img.SortOrder)
	return err
}

func (r *pgProductRepo) GetVariantImages(ctx context.Context, variantID uuid.UUID) ([]domain.VariantImage, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, variant_id, image_url, is_primary, sort_order FROM product_variant_images WHERE variant_id = $1 ORDER BY sort_order`, variantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []domain.VariantImage
	for rows.Next() {
		var img domain.VariantImage
		if err := rows.Scan(&img.ID, &img.VariantID, &img.ImageURL, &img.IsPrimary, &img.SortOrder); err != nil {
			return nil, err
		}
		images = append(images, img)
	}
	return images, nil
}

func (r *pgProductRepo) UpdateVariantStock(ctx context.Context, variantID uuid.UUID, quantity int) error {
	_, err := r.pool.Exec(ctx, `UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2`, quantity, variantID)
	return err
}

func (r *pgProductRepo) UpdateProductRating(ctx context.Context, productID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `UPDATE products SET
		average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM product_reviews WHERE product_id = $1 AND is_approved = true), 0),
		review_count = COALESCE((SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND is_approved = true), 0),
		updated_at = NOW()
		WHERE id = $1`, productID)
	return err
}

func (r *pgProductRepo) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM products`).Scan(&count)
	return count, err
}

func (r *pgProductRepo) CountLowStock(ctx context.Context, threshold int) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM products WHERE stock_quantity <= $1 AND stock_quantity > 0 AND is_active = true`, threshold).Scan(&count)
	return count, err
}

// Ensure decimal interface
var _ decimal.Decimal
