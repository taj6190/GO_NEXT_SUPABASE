package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type OrderHandler struct {
	orderService *service.OrderService
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var input domain.CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, sessionID := getUserOrSession(c)

	order, err := h.orderService.CreateOrder(c.Request.Context(), userID, sessionID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, order)
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	order, err := h.orderService.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "order not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, order)
}

func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	page, limit := utils.GetPaginationParams(c)

	orders, total, err := h.orderService.GetUserOrders(c.Request.Context(), userID, page, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, orders, page, limit, total)
}

func (h *OrderHandler) TrackOrder(c *gin.Context) {
	orderNumber := c.Param("orderNumber")
	order, err := h.orderService.GetByOrderNumber(c.Request.Context(), orderNumber)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "order not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, order)
}

// Admin
func (h *OrderHandler) AdminListOrders(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)

	filter := domain.OrderFilter{
		Search:  c.Query("search"),
		Page:    page,
		Limit:   limit,
		SortBy:  c.DefaultQuery("sort_by", "created_at"),
		SortDir: c.DefaultQuery("sort_dir", "desc"),
	}

	if status := c.Query("status"); status != "" {
		s := domain.OrderStatus(status)
		filter.Status = &s
	}

	orders, total, err := h.orderService.ListOrders(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, orders, page, limit, total)
}

func (h *OrderHandler) AdminUpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	var input struct {
		Status domain.OrderStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.orderService.UpdateStatus(c.Request.Context(), id, input.Status); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "order status updated"})
}

func (h *OrderHandler) GetDashboard(c *gin.Context) {
	stats, err := h.orderService.GetDashboardStats(c.Request.Context())
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, stats)
}
