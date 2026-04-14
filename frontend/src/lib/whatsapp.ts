// WhatsApp utility for generating links and messages

export interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price?: number | string;
  discount_price?: number | string;
  image_url?: string;
}

/**
 * Generate WhatsApp conversation URL with product details
 * Works on both local and production environments
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp message with product link
 */
export function generateProductMessage(product: ProductInfo): string {
  const websiteUrl =
    process.env.NEXT_PUBLIC_WEBSITE_URL || "https://storebd-five.vercel.app";
  const productUrl = `${websiteUrl}/products/${product.slug}`;

  let priceText = "";
  if (product.price) {
    const regularPrice = Number(product.price).toLocaleString("en-IN");
    const discountPrice = product.discount_price
      ? Number(product.discount_price).toLocaleString("en-IN")
      : null;

    if (discountPrice && Number(product.discount_price) < Number(product.price)) {
      // Show both prices when discount exists
      const discountPercent = Math.round(
        ((Number(product.price) - Number(product.discount_price)) /
          Number(product.price)) *
          100,
      );
      priceText = `\n💰 মূল্য: ৳${discountPrice} (৳${regularPrice} ছাড়ে)\n🎉 ছাড়: ${discountPercent}%`;
    } else {
      // Show only regular price if no discount
      priceText = `\n💰 মূল্য: ৳${regularPrice}`;
    }
  }

  return `হ্যালো! 👋\n\n"${product.name}" সম্পর্কে আমার প্রশ্ন আছে।\n\n🔗 পণ্যের লিঙ্ক:\n${productUrl}${priceText}\n\nদয়া করে বিস্তারিত জানান।`;
}

/**
 * Generate WhatsApp URL for product inquiry (all-in-one)
 */
export function getProductWhatsAppUrl(
  phoneNumber: string,
  product: ProductInfo,
): string {
  const message = generateProductMessage(product);
  return generateWhatsAppLink(phoneNumber, message);
}
