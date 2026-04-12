package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSON is a custom type for handling JSONB columns in PostgreSQL
type JSON json.RawMessage

func (j JSON) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return []byte(j), nil
}

func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = JSON("null")
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*j = JSON(v)
		return nil
	case string:
		*j = JSON(v)
		return nil
	default:
		return errors.New("unsupported type for JSON")
	}
}

func (j JSON) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	return []byte(j), nil
}

func (j *JSON) UnmarshalJSON(data []byte) error {
	if j == nil {
		return errors.New("JSON: UnmarshalJSON on nil pointer")
	}
	*j = JSON(data)
	return nil
}

// DomainError represents a business logic error
type DomainError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *DomainError) Error() string {
	return e.Message
}

var (
	ErrNotFound       = &DomainError{Code: 404, Message: "resource not found"}
	ErrDuplicate      = &DomainError{Code: 409, Message: "resource already exists"}
	ErrUnauthorized   = &DomainError{Code: 401, Message: "unauthorized"}
	ErrForbidden      = &DomainError{Code: 403, Message: "forbidden"}
	ErrBadRequest     = &DomainError{Code: 400, Message: "bad request"}
	ErrInternalServer = &DomainError{Code: 500, Message: "internal server error"}
	ErrOutOfStock     = &DomainError{Code: 400, Message: "product is out of stock"}
	ErrInvalidCoupon  = &DomainError{Code: 400, Message: "invalid or expired coupon"}
)
