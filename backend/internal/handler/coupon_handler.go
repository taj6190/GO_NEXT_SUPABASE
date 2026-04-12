package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/shopspring/decimal"
)

type CouponHandler struct {
	couponService *service.CouponService
}

func NewCouponHandler(couponService *service.CouponService) *CouponHandler {
	return &CouponHandler{couponService: couponService}
}

func (h *CouponHandler) Validate(c *gin.Context) {
	var input struct {
		Code       string `json:"code" binding:"required"`
		OrderTotal string `json:"order_total" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	total, err := decimal.NewFromString(input.OrderTotal)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid order total")
		return
	}

	coupon, discount, err := h.couponService.Validate(c.Request.Context(), input.Code, total)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"coupon":   coupon,
		"discount": discount,
	})
}

// Admin
func (h *CouponHandler) List(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)
	coupons, total, err := h.couponService.List(c.Request.Context(), page, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, coupons, page, limit, total)
}

func (h *CouponHandler) Create(c *gin.Context) {
	var input domain.CreateCouponInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	coupon, err := h.couponService.Create(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, coupon)
}

func (h *CouponHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid coupon ID")
		return
	}

	var input domain.UpdateCouponInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	coupon, err := h.couponService.Update(c.Request.Context(), id, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, coupon)
}

func (h *CouponHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid coupon ID")
		return
	}

	if err := h.couponService.Delete(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "coupon deleted"})
}
