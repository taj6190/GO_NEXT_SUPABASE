package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetPaginationParams(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 12
	}
	if limit > 100 {
		limit = 100
	}

	return page, limit
}

func GetOffset(page, limit int) int {
	return (page - 1) * limit
}
