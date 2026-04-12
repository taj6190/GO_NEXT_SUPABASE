package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgWishlistRepo struct {
	pool *pgxpool.Pool
}

func NewWishlistRepository(pool *pgxpool.Pool) domain.WishlistRepository {
	return &pgWishlistRepo{pool: pool}
}

func (r *pgWishlistRepo) GetOrCreateDefault(ctx context.Context, userID uuid.UUID) (*domain.Wishlist, error) {
	w := &domain.Wishlist{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, created_at FROM wishlists WHERE user_id = $1 LIMIT 1`, userID,
	).Scan(&w.ID, &w.UserID, &w.Name, &w.CreatedAt)

	if err == pgx.ErrNoRows {
		w.ID = uuid.New()
		w.UserID = userID
		w.Name = "My Wishlist"
		err = r.pool.QueryRow(ctx,
			`INSERT INTO wishlists (id, user_id, name) VALUES ($1, $2, $3) RETURNING created_at`,
			w.ID, w.UserID, w.Name,
		).Scan(&w.CreatedAt)
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	items, _ := r.GetItems(ctx, w.ID)
	w.Items = items
	return w, nil
}

func (r *pgWishlistRepo) AddItem(ctx context.Context, item *domain.WishlistItem) error {
	item.ID = uuid.New()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO wishlist_items (id, wishlist_id, product_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
		item.ID, item.WishlistID, item.ProductID,
	)
	return err
}

func (r *pgWishlistRepo) RemoveItem(ctx context.Context, wishlistID uuid.UUID, productID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2`, wishlistID, productID)
	return err
}

func (r *pgWishlistRepo) GetItems(ctx context.Context, wishlistID uuid.UUID) ([]domain.WishlistItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT wi.id, wi.wishlist_id, wi.product_id, wi.added_at,
		p.id, p.name, p.slug, p.price, p.discount_price, p.stock_quantity, p.is_active,
		(SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1)
		FROM wishlist_items wi JOIN products p ON wi.product_id = p.id WHERE wi.wishlist_id = $1
		ORDER BY wi.added_at DESC`, wishlistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.WishlistItem
	for rows.Next() {
		var item domain.WishlistItem
		var p domain.Product
		var primaryImage *string
		if err := rows.Scan(
			&item.ID, &item.WishlistID, &item.ProductID, &item.AddedAt,
			&p.ID, &p.Name, &p.Slug, &p.Price, &p.DiscountPrice, &p.StockQuantity, &p.IsActive,
			&primaryImage,
		); err != nil {
			return nil, err
		}
		if primaryImage != nil {
			p.Images = []domain.ProductImage{{ImageURL: *primaryImage, IsPrimary: true}}
		}
		item.Product = &p
		items = append(items, item)
	}
	return items, nil
}

func (r *pgWishlistRepo) HasItem(ctx context.Context, wishlistID uuid.UUID, productID uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2`, wishlistID, productID,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

var _ = fmt.Sprintf // ensure import
