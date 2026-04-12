package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const SessionCookieName = "guest_session_id"

func GuestSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if user is authenticated
		_, exists := c.Get("user_id")
		if exists {
			c.Next()
			return
		}

		// Check for existing session from header or cookie
		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			sessionID, _ = c.Cookie(SessionCookieName)
		}

		// Generate new session if none exists
		if sessionID == "" {
			sessionID = uuid.New().String()
			c.SetCookie(SessionCookieName, sessionID, 60*60*24*30, "/", "", false, false)
		}

		c.Set("session_id", sessionID)
		c.Next()
	}
}
