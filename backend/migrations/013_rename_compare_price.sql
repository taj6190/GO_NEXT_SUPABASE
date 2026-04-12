-- Migration 013: Rename compare_price to discount_price
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='compare_price') THEN
    ALTER TABLE products RENAME COLUMN compare_price TO discount_price;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='compare_price') THEN
    ALTER TABLE product_variants RENAME COLUMN compare_price TO discount_price;
  END IF;
END $$;
