package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "user not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	var input domain.UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.UpdateProfile(c.Request.Context(), userID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, user)
}

// Admin
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)
	search := c.Query("search")

	users, total, err := h.userService.List(c.Request.Context(), page, limit, search)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, users, page, limit, total)
}

func (h *UserHandler) AdminUpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid user ID")
		return
	}

	var input domain.UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.AdminUpdateUser(c.Request.Context(), id, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, user)
}
