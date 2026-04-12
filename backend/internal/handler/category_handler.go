package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
)

type CategoryHandler struct {
	categoryService *service.CategoryService
}

func NewCategoryHandler(categoryService *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

func (h *CategoryHandler) GetTree(c *gin.Context) {
	cats, err := h.categoryService.GetTree(c.Request.Context())
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, cats)
}

func (h *CategoryHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	cat, err := h.categoryService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "category not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, cat)
}

func (h *CategoryHandler) List(c *gin.Context) {
	cats, err := h.categoryService.List(c.Request.Context())
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, cats)
}

// Admin
func (h *CategoryHandler) Create(c *gin.Context) {
	var input domain.CreateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	cat, err := h.categoryService.Create(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, cat)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid category ID")
		return
	}

	var input domain.UpdateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	cat, err := h.categoryService.Update(c.Request.Context(), id, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, cat)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid category ID")
		return
	}

	if err := h.categoryService.Delete(c.Request.Context(), id); err != nil {
		fmt.Println("DELETE CATEGORY ERROR:", err) // 👈 ADD THIS

		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "category deleted"})
}
