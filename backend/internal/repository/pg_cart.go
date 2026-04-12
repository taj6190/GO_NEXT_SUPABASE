package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgCartRepo struct {
	pool *pgxpool.Pool
}

func NewCartRepository(pool *pgxpool.Pool) domain.CartRepository {
	return &pgCartRepo{pool: pool}
}

func (r *pgCartRepo) AddItem(ctx context.Context, item *domain.CartItem) error {
	item.ID = uuid.New()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO cart_items (id, user_id, session_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4, $5, $6)`,
		item.ID, item.UserID, item.SessionID, item.ProductID, item.VariantID, item.Quantity,
	)
	return err
}

func (r *pgCartRepo) GetItem(ctx context.Context, id uuid.UUID) (*domain.CartItem, error) {
	item := &domain.CartItem{}
	var vid uuid.NullUUID
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, session_id, product_id, variant_id, quantity, created_at, updated_at FROM cart_items WHERE id = $1`, id,
	).Scan(
		&item.ID, &item.UserID, &item.SessionID, &item.ProductID, &vid, &item.Quantity, &item.CreatedAt, &item.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("cart item not found")
	}
	if err != nil {
		return nil, err
	}
	if vid.Valid {
		u := vid.UUID
		item.VariantID = &u
	}
	return item, nil
}

func (r *pgCartRepo) GetByUserProductVariant(ctx context.Context, userID uuid.UUID, productID uuid.UUID, variantID *uuid.UUID) (*domain.CartItem, error) {
	item := &domain.CartItem{}
	var vid uuid.NullUUID
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, session_id, product_id, variant_id, quantity, created_at, updated_at
		 FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
		userID, productID, variantID,
	).Scan(
		&item.ID, &item.UserID, &item.SessionID, &item.ProductID, &vid, &item.Quantity, &item.CreatedAt, &item.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if vid.Valid {
		u := vid.UUID
		item.VariantID = &u
	}
	return item, nil
}

func (r *pgCartRepo) GetBySessionProductVariant(ctx context.Context, sessionID string, productID uuid.UUID, variantID *uuid.UUID) (*domain.CartItem, error) {
	item := &domain.CartItem{}
	var vid uuid.NullUUID
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, session_id, product_id, variant_id, quantity, created_at, updated_at
		 FROM cart_items WHERE session_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
		sessionID, productID, variantID,
	).Scan(
		&item.ID, &item.UserID, &item.SessionID, &item.ProductID, &vid, &item.Quantity, &item.CreatedAt, &item.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if vid.Valid {
		u := vid.UUID
		item.VariantID = &u
	}
	return item, nil
}

func (r *pgCartRepo) UpdateQuantity(ctx context.Context, id uuid.UUID, quantity int) error {
	_, err := r.pool.Exec(ctx, `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`, quantity, id)
	return err
}

func (r *pgCartRepo) RemoveItem(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE id = $1`, id)
	return err
}

func (r *pgCartRepo) loadVariant(ctx context.Context, variantID uuid.UUID) (*domain.Variant, error) {
	v := &domain.Variant{}
	err := r.pool.QueryRow(ctx, `SELECT id, product_id, sku, price, discount_price, stock_quantity, weight, is_active, sort_order, created_at
		FROM product_variants WHERE id = $1`, variantID).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.Price, &v.DiscountPrice, &v.StockQuantity, &v.Weight, &v.IsActive, &v.SortOrder, &v.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
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
	for rows.Next() {
		var o domain.VariantOption
		if err := rows.Scan(&o.ID, &o.VariantID, &o.OptionGroupID, &o.OptionValueID, &o.GroupName, &o.ValueName); err != nil {
			return nil, err
		}
		v.Options = append(v.Options, o)
	}
	imgRows, err := r.pool.Query(ctx, `SELECT id, variant_id, image_url, is_primary, sort_order FROM product_variant_images WHERE variant_id = $1 ORDER BY sort_order`, variantID)
	if err != nil {
		return nil, err
	}
	defer imgRows.Close()
	for imgRows.Next() {
		var img domain.VariantImage
		if err := imgRows.Scan(&img.ID, &img.VariantID, &img.ImageURL, &img.IsPrimary, &img.SortOrder); err != nil {
			return nil, err
		}
		v.Images = append(v.Images, img)
	}
	return v, nil
}

const cartProductSelect = `SELECT ci.id, ci.user_id, ci.session_id, ci.product_id, ci.variant_id, ci.quantity, ci.created_at, ci.updated_at,
		p.id, p.name, p.slug, p.price, p.discount_price, p.stock_quantity, p.is_active,
		(SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1)
		FROM cart_items ci JOIN products p ON ci.product_id = p.id`

func (r *pgCartRepo) hydrateCartItems(ctx context.Context, rows pgx.Rows) ([]domain.CartItem, error) {
	defer rows.Close()
	var items []domain.CartItem
	for rows.Next() {
		var item domain.CartItem
		var p domain.Product
		var primaryImage *string
		var vid uuid.NullUUID
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.SessionID, &item.ProductID, &vid, &item.Quantity,
			&item.CreatedAt, &item.UpdatedAt,
			&p.ID, &p.Name, &p.Slug, &p.Price, &p.DiscountPrice, &p.StockQuantity, &p.IsActive,
			&primaryImage,
		); err != nil {
			return nil, err
		}
		if primaryImage != nil {
			p.Images = []domain.ProductImage{{ImageURL: *primaryImage, IsPrimary: true}}
		}
		item.Product = &p
		if vid.Valid {
			u := vid.UUID
			item.VariantID = &u
			v, err := r.loadVariant(ctx, u)
			if err == nil {
				item.Variant = v
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *pgCartRepo) GetUserCart(ctx context.Context, userID uuid.UUID) ([]domain.CartItem, error) {
	rows, err := r.pool.Query(ctx, cartProductSelect+` WHERE ci.user_id = $1 ORDER BY ci.created_at`, userID)
	if err != nil {
		return nil, err
	}
	return r.hydrateCartItems(ctx, rows)
}

func (r *pgCartRepo) GetSessionCart(ctx context.Context, sessionID string) ([]domain.CartItem, error) {
	rows, err := r.pool.Query(ctx, cartProductSelect+` WHERE ci.session_id = $1 ORDER BY ci.created_at`, sessionID)
	if err != nil {
		return nil, err
	}
	return r.hydrateCartItems(ctx, rows)
}

func (r *pgCartRepo) ClearUserCart(ctx context.Context, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}

func (r *pgCartRepo) ClearSessionCart(ctx context.Context, sessionID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cart_items WHERE session_id = $1`, sessionID)
	return err
}

func (r *pgCartRepo) MergeSessionToUser(ctx context.Context, sessionID string, userID uuid.UUID) error {
	sessionItems, err := r.GetSessionCart(ctx, sessionID)
	if err != nil {
		return err
	}

	for _, item := range sessionItems {
		existing, _ := r.GetByUserProductVariant(ctx, userID, item.ProductID, item.VariantID)
		if existing != nil {
			_ = r.UpdateQuantity(ctx, existing.ID, existing.Quantity+item.Quantity)
			_ = r.RemoveItem(ctx, item.ID)
		} else {
			_, err := r.pool.Exec(ctx, `UPDATE cart_items SET user_id = $1, session_id = NULL WHERE id = $2`, userID, item.ID)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
