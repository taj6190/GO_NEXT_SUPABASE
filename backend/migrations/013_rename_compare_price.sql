-- Migration 013: Rename compare_price to discount_price
ALTER TABLE products RENAME COLUMN compare_price TO discount_price;
ALTER TABLE product_variants RENAME COLUMN compare_price TO discount_price;
