-- Migration 011: Product Variants System
-- Option groups define the variation axes (e.g. Color, Size, Storage)
CREATE TABLE IF NOT EXISTS product_option_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_option_groups_product ON product_option_groups(product_id);

-- Option values are the specific choices (e.g. Red, Blue, XL, 256GB)
CREATE TABLE IF NOT EXISTS product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_option_values_group ON product_option_values(option_group_id);

-- Variants are the actual purchasable combinations (e.g. Red/XL, Blue/M)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(12, 2) DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    weight DECIMAL(8, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- Maps variants to their selected option values
CREATE TABLE IF NOT EXISTS product_variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
    UNIQUE(variant_id, option_group_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_options_variant ON product_variant_options(variant_id);

-- Variant-specific images
CREATE TABLE IF NOT EXISTS product_variant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_variant_images_variant ON product_variant_images(variant_id);

-- Add variant_id to cart_items and order_items for variant tracking
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_options TEXT DEFAULT '';
