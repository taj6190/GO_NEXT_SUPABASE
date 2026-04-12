package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	GinMode          string
	DatabaseURL      string
	RedisURL         string
	JWTSecret        string
	JWTExpiry        time.Duration
	JWTRefreshExpiry time.Duration
	CloudinaryName   string
	CloudinaryKey    string
	CloudinarySecret string
	FrontendURL      string
	AdminEmail       string
	AdminPassword    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Port:             getEnv("PORT", "8080"),
		GinMode:          getEnv("GIN_MODE", "debug"),
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:        getEnv("JWT_SECRET", ""),
		CloudinaryName:   getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinarySecret: getEnv("CLOUDINARY_API_SECRET", ""),
		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:3000"),
		AdminEmail:       getEnv("ADMIN_EMAIL", "admin@gonext.com"),
		AdminPassword:    getEnv("ADMIN_PASSWORD", "admin123456"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	var err error
	cfg.JWTExpiry, err = time.ParseDuration(getEnv("JWT_EXPIRY", "15m"))
	if err != nil {
		cfg.JWTExpiry = 15 * time.Minute
	}

	cfg.JWTRefreshExpiry, err = time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		cfg.JWTRefreshExpiry = 168 * time.Hour
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
