package utils

import (
	"fmt"
	"regexp"
	"strings"
	"math/rand"
	"time"
)

func GenerateSlug(name string) string {
	slug := strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func GenerateOrderNumber() string {
	now := time.Now()
	r := rand.New(rand.NewSource(now.UnixNano()))
	return fmt.Sprintf("GN-%s-%04d", now.Format("20060102"), r.Intn(10000))
}

func GenerateSKU(name string) string {
	slug := strings.ToUpper(name)
	reg := regexp.MustCompile(`[^A-Z0-9]+`)
	slug = reg.ReplaceAllString(slug, "")
	if len(slug) > 6 {
		slug = slug[:6]
	}
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return fmt.Sprintf("%s-%04d", slug, r.Intn(10000))
}
