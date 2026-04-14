// WhatsApp utility for generating links and messages

export interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  price?: number | string;
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

  const priceText = product.price
    ? `\n💰 মূল্য: ৳${Number(product.price).toLocaleString("en-IN")}`
    : "";

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
