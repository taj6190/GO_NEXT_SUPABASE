package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type AddressHandler struct {
	addressService *service.AddressService
}

func NewAddressHandler(addressService *service.AddressService) *AddressHandler {
	return &AddressHandler{addressService: addressService}
}

func (h *AddressHandler) Create(c *gin.Context) {
	var input domain.CreateAddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, sessionID := getUserOrSession(c)
	addr, err := h.addressService.Create(c.Request.Context(), userID, sessionID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, addr)
}

func (h *AddressHandler) GetUserAddresses(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	addresses, err := h.addressService.GetUserAddresses(c.Request.Context(), userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, addresses)
}

func (h *AddressHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid address ID")
		return
	}

	var input domain.CreateAddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	addr, err := h.addressService.Update(c.Request.Context(), id, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, addr)
}

func (h *AddressHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid address ID")
		return
	}

	if err := h.addressService.Delete(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "address deleted"})
}

func (h *AddressHandler) SetDefault(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid address ID")
		return
	}

	if err := h.addressService.SetDefault(c.Request.Context(), userID, id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "default address set"})
}
