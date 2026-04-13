package main

import (
	"context"
	"fmt"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func mains() {
	cld, _ := cloudinary.NewFromParams("dvjyqpdhx", "392311941428618", "E9L_bS41I_AxZQqnEwdqDvVCulI")
	res, err := cld.Upload.Upload(context.Background(), "dummy.jpg", uploader.UploadParams{Folder: "test"})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("SecureURL: '%s'\n", res.SecureURL)
	fmt.Printf("Error struct: %v\n", res.Error)
}
