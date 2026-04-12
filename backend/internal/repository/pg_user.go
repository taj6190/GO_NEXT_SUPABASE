package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

type pgUserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) domain.UserRepository {
	return &pgUserRepo{pool: pool}
}

func (r *pgUserRepo) Create(ctx context.Context, user *domain.User) error {
	query := `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING created_at, updated_at`
	user.ID = uuid.New()
	return r.pool.QueryRow(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.FullName, user.Phone, user.Role, user.IsActive,
	).Scan(&user.CreatedAt, &user.UpdatedAt)
}

func (r *pgUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, email, password_hash, full_name, phone, role, is_active, created_at, updated_at
		FROM users WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Phone,
		&user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

func (r *pgUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	user := &domain.User{}
	query := `SELECT id, email, password_hash, full_name, phone, role, is_active, created_at, updated_at
		FROM users WHERE email = $1`
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Phone,
		&user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *pgUserRepo) Update(ctx context.Context, user *domain.User) error {
	query := `UPDATE users SET full_name = $1, phone = $2, role = $3, is_active = $4, updated_at = NOW()
		WHERE id = $5`
	_, err := r.pool.Exec(ctx, query, user.FullName, user.Phone, user.Role, user.IsActive, user.ID)
	return err
}

func (r *pgUserRepo) List(ctx context.Context, page, limit int, search string) ([]domain.User, int64, error) {
	offset := (page - 1) * limit
	var total int64
	var users []domain.User

	countQuery := `SELECT COUNT(*) FROM users WHERE 1=1`
	dataQuery := `SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		filter := fmt.Sprintf(` AND (email ILIKE $%d OR full_name ILIKE $%d)`, argIdx, argIdx)
		countQuery += filter
		dataQuery += filter
		args = append(args, "%"+search+"%")
		argIdx++
	}

	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	dataQuery += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Phone, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}

	return users, total, nil
}

func (r *pgUserRepo) CountByRole(ctx context.Context, role domain.UserRole) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = $1`, role).Scan(&count)
	return count, err
}
