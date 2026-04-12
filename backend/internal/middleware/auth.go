package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "invalid authorization format")
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(parts[1], jwtSecret)
		if err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		if claims.Type != utils.AccessToken {
			utils.ErrorResponse(c, http.StatusUnauthorized, "invalid token type")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

// OptionalAuth extracts user info if token exists but doesn't block the request
func OptionalAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		claims, err := utils.ValidateToken(parts[1], jwtSecret)
		if err != nil || claims.Type != utils.AccessToken {
			c.Next()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}
