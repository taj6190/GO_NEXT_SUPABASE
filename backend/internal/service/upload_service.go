package service

import (
	"context"
	"fmt"

	"io"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gonext-ecommerce/backend/internal/config"
)

type UploadService struct {
	cld *cloudinary.Cloudinary
}

func NewUploadService(cfg *config.Config) *UploadService {
	cld, err := cloudinary.NewFromParams(cfg.CloudinaryName, cfg.CloudinaryKey, cfg.CloudinarySecret)
	if err != nil {
		fmt.Printf("Warning: Cloudinary not configured: %v\n", err)
		return &UploadService{}
	}
	return &UploadService{cld: cld}
}

func (s *UploadService) UploadImage(ctx context.Context, file io.Reader, folder string) (string, error) {
	if s.cld == nil {
		return "", fmt.Errorf("cloudinary not configured")
	}

	result, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         "gonext/" + folder,
		Transformation: "c_limit,w_1200,h_1200,q_auto,f_auto",
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload image: %w", err)
	}
	if result.Error.Message != "" {
		return "", fmt.Errorf("cloudinary api error: %s", result.Error.Message)
	}

	return result.SecureURL, nil
}

func (s *UploadService) DeleteImage(ctx context.Context, publicID string) error {
	if s.cld == nil {
		return fmt.Errorf("cloudinary not configured")
	}

	_, err := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}
