package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists || role != "admin" {
			utils.ErrorResponse(c, http.StatusForbidden, "admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}
