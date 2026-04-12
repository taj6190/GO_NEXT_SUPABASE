package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type ReviewHandler struct {
	reviewService *service.ReviewService
}

func NewReviewHandler(reviewService *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

func (h *ReviewHandler) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "login required to review")
		return
	}

	var input domain.CreateReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	uid := userID.(uuid.UUID)
	review, err := h.reviewService.Create(c.Request.Context(), uid, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, review)
}

func (h *ReviewHandler) ListByProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	filter := domain.ReviewFilter{
		SortBy:    c.DefaultQuery("sort_by", "created_at"),
		SortOrder: c.DefaultQuery("sort_order", "desc"),
		Page:      page,
		Limit:     limit,
	}

	reviews, total, err := h.reviewService.ListByProduct(c.Request.Context(), productID, filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, reviews, page, limit, total)
}

func (h *ReviewHandler) GetSummary(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("productId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	summary, err := h.reviewService.GetSummary(c.Request.Context(), productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, summary)
}

func (h *ReviewHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid review ID")
		return
	}

	if err := h.reviewService.Delete(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "review deleted"})
}
