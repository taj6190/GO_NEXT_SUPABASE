package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gonext-ecommerce/backend/internal/domain"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ProductHandler struct {
	productService *service.ProductService
}

func NewProductHandler(productService *service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

func (h *ProductHandler) List(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)

	filter := domain.ProductFilter{
		Search:    c.Query("search"),
		SortBy:    c.DefaultQuery("sort_by", "created_at"),
		SortOrder: c.DefaultQuery("sort_order", "desc"),
		Page:      page,
		Limit:     limit,
	}

	if catID := c.Query("category_id"); catID != "" {
		id, err := uuid.Parse(catID)
		if err == nil {
			filter.CategoryID = &id
		}
	}

	if minPrice := c.Query("min_price"); minPrice != "" {
		p, err := decimal.NewFromString(minPrice)
		if err == nil {
			filter.MinPrice = &p
		}
	}

	if maxPrice := c.Query("max_price"); maxPrice != "" {
		p, err := decimal.NewFromString(maxPrice)
		if err == nil {
			filter.MaxPrice = &p
		}
	}

	if minRating := c.Query("min_rating"); minRating != "" {
		r, err := strconv.ParseFloat(minRating, 64)
		if err == nil {
			filter.MinRating = &r
		}
	}

	// Public listing shows only active products
	isActive := true
	filter.IsActive = &isActive

	products, total, err := h.productService.List(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, products, page, limit, total)
}

func (h *ProductHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	product, err := h.productService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, product)
}

func (h *ProductHandler) GetFeatured(c *gin.Context) {
	products, err := h.productService.GetFeatured(c.Request.Context(), 8)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, products)
}

func (h *ProductHandler) GetRelated(c *gin.Context) {
	slug := c.Param("slug")
	product, err := h.productService.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found")
		return
	}

	related, err := h.productService.GetRelated(c.Request.Context(), product.ID, product.CategoryID, 8)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, related)
}

func (h *ProductHandler) Search(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "search query required")
		return
	}

	isActive := true
	filter := domain.ProductFilter{
		Search:   query,
		IsActive: &isActive,
		Page:     page,
		Limit:    limit,
	}

	products, total, err := h.productService.List(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, products, page, limit, total)
}

// Admin
func (h *ProductHandler) AdminList(c *gin.Context) {
	page, limit := utils.GetPaginationParams(c)

	filter := domain.ProductFilter{
		Search:    c.Query("search"),
		SortBy:    c.DefaultQuery("sort_by", "created_at"),
		SortOrder: c.DefaultQuery("sort_order", "desc"),
		Page:      page,
		Limit:     limit,
	}

	products, total, err := h.productService.List(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.PaginatedResponse(c, products, page, limit, total)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var input domain.CreateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.productService.Create(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	var input domain.UpdateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	product, err := h.productService.Update(c.Request.Context(), id, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	if err := h.productService.Delete(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "product deleted",
	})
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product ID")
		return
	}

	product, err := h.productService.GetByID(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, product)
}
