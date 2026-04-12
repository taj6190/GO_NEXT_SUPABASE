package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gonext-ecommerce/backend/internal/service"
	"github.com/gonext-ecommerce/backend/internal/utils"
)

type UploadHandler struct {
	uploadService *service.UploadService
}

func NewUploadHandler(uploadService *service.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "image file required")
		return
	}
	defer file.Close()

	folder := c.DefaultPostForm("folder", "products")

	url, err := h.uploadService.UploadImage(c.Request.Context(), file, folder)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"url": url,
	})
}
