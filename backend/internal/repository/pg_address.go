package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgAddressRepo struct {
	pool *pgxpool.Pool
}

func NewAddressRepository(pool *pgxpool.Pool) domain.AddressRepository {
	return &pgAddressRepo{pool: pool}
}

func (r *pgAddressRepo) Create(ctx context.Context, address *domain.Address) error {
	address.ID = uuid.New()
	query := `INSERT INTO addresses (id, user_id, guest_session_id, full_name, phone, address_line1, address_line2, city, district, postal_code, is_default)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING created_at`
	return r.pool.QueryRow(ctx, query,
		address.ID, address.UserID, address.GuestSessionID, address.FullName, address.Phone,
		address.AddressLine1, address.AddressLine2, address.City, address.District,
		address.PostalCode, address.IsDefault,
	).Scan(&address.CreatedAt)
}

func (r *pgAddressRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Address, error) {
	a := &domain.Address{}
	query := `SELECT id, user_id, guest_session_id, full_name, phone, address_line1, address_line2, city, district, postal_code, is_default, created_at
		FROM addresses WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.UserID, &a.GuestSessionID, &a.FullName, &a.Phone,
		&a.AddressLine1, &a.AddressLine2, &a.City, &a.District, &a.PostalCode,
		&a.IsDefault, &a.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *pgAddressRepo) Update(ctx context.Context, address *domain.Address) error {
	query := `UPDATE addresses SET full_name=$1, phone=$2, address_line1=$3, address_line2=$4, city=$5, district=$6, postal_code=$7, is_default=$8 WHERE id=$9`
	_, err := r.pool.Exec(ctx, query,
		address.FullName, address.Phone, address.AddressLine1, address.AddressLine2,
		address.City, address.District, address.PostalCode, address.IsDefault, address.ID,
	)
	return err
}

func (r *pgAddressRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM addresses WHERE id = $1`, id)
	return err
}

func (r *pgAddressRepo) GetUserAddresses(ctx context.Context, userID uuid.UUID) ([]domain.Address, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, guest_session_id, full_name, phone, address_line1, address_line2, city, district, postal_code, is_default, created_at
		FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addresses []domain.Address
	for rows.Next() {
		var a domain.Address
		if err := rows.Scan(&a.ID, &a.UserID, &a.GuestSessionID, &a.FullName, &a.Phone,
			&a.AddressLine1, &a.AddressLine2, &a.City, &a.District, &a.PostalCode,
			&a.IsDefault, &a.CreatedAt); err != nil {
			return nil, err
		}
		addresses = append(addresses, a)
	}
	return addresses, nil
}

func (r *pgAddressRepo) SetDefault(ctx context.Context, userID uuid.UUID, addressID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `UPDATE addresses SET is_default = false WHERE user_id = $1`, userID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2`, addressID, userID)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}
