package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type PaymentHandler struct {
	paymentService *service.PaymentService
}

func NewPaymentHandler(paymentService *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService}
}

func (h *PaymentHandler) InitiatePayment(c *gin.Context) {
	var input domain.InitiatePaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.paymentService.InitiatePayment(c.Request.Context(), input.OrderID, input.Method)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, result)
}

func (h *PaymentHandler) BkashCallback(c *gin.Context) {
	paymentID := c.Query("payment_id")
	status := c.DefaultQuery("status", "success")
	txnID := c.DefaultQuery("txn_id", "BKASH-MOCK-"+uuid.New().String()[:8])

	err := h.paymentService.ProcessBkashCallback(c.Request.Context(), paymentID, status, txnID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "payment processed", "transaction_id": txnID})
}

func (h *PaymentHandler) NagadCallback(c *gin.Context) {
	paymentID := c.Query("payment_id")
	status := c.DefaultQuery("status", "success")
	txnID := c.DefaultQuery("txn_id", "NAGAD-MOCK-"+uuid.New().String()[:8])

	err := h.paymentService.ProcessNagadCallback(c.Request.Context(), paymentID, status, txnID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "payment processed", "transaction_id": txnID})
}

func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("orderId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	payment, err := h.paymentService.GetByOrderID(c.Request.Context(), orderID)
	if err != nil || payment == nil {
		utils.ErrorResponse(c, http.StatusNotFound, "payment not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, payment)
}

func (h *PaymentHandler) ListPayments(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)
	payments, total, err := h.paymentService.List(c.Request.Context(), page, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, payments, page, limit, total)
}
