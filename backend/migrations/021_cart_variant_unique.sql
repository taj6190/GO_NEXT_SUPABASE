-- Allow separate cart lines per product variant (same product, different options).
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS unique_user_product;

CREATE UNIQUE INDEX IF NOT EXISTS cart_user_product_simple
  ON cart_items (user_id, product_id)
  WHERE user_id IS NOT NULL AND variant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cart_user_product_variant
  ON cart_items (user_id, product_id, variant_id)
  WHERE user_id IS NOT NULL AND variant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cart_session_product_simple
  ON cart_items (session_id, product_id)
  WHERE session_id IS NOT NULL AND session_id <> '' AND variant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cart_session_product_variant
  ON cart_items (session_id, product_id, variant_id)
  WHERE session_id IS NOT NULL AND session_id <> '' AND variant_id IS NOT NULL;
