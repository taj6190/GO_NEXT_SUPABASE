package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type AuthHandler struct {
	authService *service.AuthService
	cartService *service.CartService
}

func NewAuthHandler(authService *service.AuthService, cartService *service.CartService) *AuthHandler {
	return &AuthHandler{authService: authService, cartService: cartService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input domain.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, tokens, err := h.authService.Register(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Merge guest cart if session exists
	sessionID, _ := c.Cookie("guest_session_id")
	if sessionID != "" {
		_ = h.cartService.MergeCart(c.Request.Context(), sessionID, user.ID)
	}

	utils.SuccessResponse(c, http.StatusCreated, gin.H{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input domain.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, tokens, err := h.authService.Login(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	// Merge guest cart if session exists
	sessionID, _ := c.Cookie("guest_session_id")
	if sessionID != "" {
		_ = h.cartService.MergeCart(c.Request.Context(), sessionID, user.ID)
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	tokens, err := h.authService.RefreshToken(c.Request.Context(), input.RefreshToken)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tokens)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	user, err := h.authService.GetCurrentUser(c.Request.Context(), userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "user not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, user)
}
