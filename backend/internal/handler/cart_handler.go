package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type CartHandler struct {
	cartService *service.CartService
}

func NewCartHandler(cartService *service.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID, sessionID := getUserOrSession(c)
	items, err := h.cartService.GetCart(c.Request.Context(), userID, sessionID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if items == nil {
		items = []domain.CartItem{}
	}
	utils.SuccessResponse(c, http.StatusOK, items)
}

func (h *CartHandler) AddItem(c *gin.Context) {
	var input domain.AddToCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, sessionID := getUserOrSession(c)
	item, err := h.cartService.AddItem(c.Request.Context(), userID, sessionID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, item)
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid item ID")
		return
	}

	var input domain.UpdateCartItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.cartService.UpdateItem(c.Request.Context(), itemID, input.Quantity); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "cart updated"})
}

func (h *CartHandler) RemoveItem(c *gin.Context) {
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid item ID")
		return
	}

	if err := h.cartService.RemoveItem(c.Request.Context(), itemID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "item removed"})
}

func (h *CartHandler) ClearCart(c *gin.Context) {
	userID, sessionID := getUserOrSession(c)
	if err := h.cartService.ClearCart(c.Request.Context(), userID, sessionID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "cart cleared"})
}

func (h *CartHandler) MergeCart(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	sessionID, _ := c.Cookie("guest_session_id")
	if sessionID == "" {
		sessionID = c.GetHeader("X-Session-ID")
	}
	if sessionID == "" {
		utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "no session to merge"})
		return
	}

	if err := h.cartService.MergeCart(c.Request.Context(), sessionID, userID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "cart merged"})
}

func getUserOrSession(c *gin.Context) (*uuid.UUID, string) {
	if id, exists := c.Get("user_id"); exists {
		uid := id.(uuid.UUID)
		return &uid, ""
	}
	sessionID, _ := c.Get("session_id")
	if sessionID != nil {
		s := sessionID.(string)
		return nil, s
	}
	return nil, ""
}
