package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// CacheManager provides a consistent interface for Redis caching operations
type CacheManager struct {
	rdb *redis.Client
}

// NewCacheManager creates a new cache manager
func NewCacheManager(rdb *redis.Client) *CacheManager {
	return &CacheManager{rdb: rdb}
}

// Set stores a value in cache with JSON serialization
func (cm *CacheManager) Set(ctx context.Context, key string, data interface{}, ttl time.Duration) error {
	if cm.rdb == nil {
		return nil
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	return cm.rdb.Set(ctx, key, jsonData, ttl).Err()
}

// Get retrieves a value from cache with JSON deserialization
func (cm *CacheManager) Get(ctx context.Context, key string, data interface{}) error {
	if cm.rdb == nil {
		return fmt.Errorf("cache not available")
	}

	val, err := cm.rdb.Get(ctx, key).Result()
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), data)
}

// Delete removes a value from cache
func (cm *CacheManager) Delete(ctx context.Context, keys ...string) error {
	if cm.rdb == nil {
		return nil
	}

	return cm.rdb.Del(ctx, keys...).Err()
}

// DeletePattern removes all keys matching a pattern
func (cm *CacheManager) DeletePattern(ctx context.Context, pattern string) error {
	if cm.rdb == nil {
		return nil
	}

	keys, err := cm.rdb.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}

	if len(keys) > 0 {
		return cm.rdb.Del(ctx, keys...).Err()
	}

	return nil
}

// IsAvailable checks if Redis client is available
func (cm *CacheManager) IsAvailable() bool {
	return cm.rdb != nil
}

// Ping checks Redis connectivity
func (cm *CacheManager) Ping(ctx context.Context) error {
	if cm.rdb == nil {
		return fmt.Errorf("redis client not initialized")
	}
	return cm.rdb.Ping(ctx).Err()
}
