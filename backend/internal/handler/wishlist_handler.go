package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type WishlistHandler struct {
	wishlistService *service.WishlistService
}

func NewWishlistHandler(wishlistService *service.WishlistService) *WishlistHandler {
	return &WishlistHandler{wishlistService: wishlistService}
}

func (h *WishlistHandler) GetWishlist(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	wishlist, err := h.wishlistService.GetWishlist(c.Request.Context(), userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, wishlist)
}

func (h *WishlistHandler) AddItem(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	var input domain.AddToWishlistInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.wishlistService.AddItem(c.Request.Context(), userID, input.ProductID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, gin.H{"message": "added to wishlist"})
}

func (h *WishlistHandler) RemoveItem(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	if err := h.wishlistService.RemoveItem(c.Request.Context(), userID, productID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "removed from wishlist"})
}
