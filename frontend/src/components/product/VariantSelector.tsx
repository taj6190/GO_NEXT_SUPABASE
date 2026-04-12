"use client";

import { Product, Variant, OptionGroup } from "@/lib/types";

interface Props {
  product: Product;
  selectedVariant: Variant | null;
  onVariantChange: (variant: Variant | null) => void;
  selectedOptions: Record<string, string>;
  onOptionChange: (groupId: string, valueId: string) => void;
}

export default function VariantSelector({ product, selectedVariant, selectedOptions, onOptionChange }: Props) {
  if (!product.option_groups || product.option_groups.length === 0) return null;

  const isColorGroup = (group: OptionGroup) => {
    return group.name.toLowerCase().includes("color") || group.name.toLowerCase().includes("colour");
  };

  const isValueAvailable = (groupId: string, valueId: string): boolean => {
    if (!product.variants) return false;
    // Check if any active variant has this value
    return product.variants.some((v) => {
      if (!v.is_active || v.stock_quantity <= 0) return false;
      const hasThisValue = v.options?.some((o) => o.option_value_id === valueId);
      if (!hasThisValue) return false;
      // Check compatibility with other selected options
      for (const [gId, vId] of Object.entries(selectedOptions)) {
        if (gId === groupId) continue;
        const hasOther = v.options?.some((o) => o.option_group_id === gId && o.option_value_id === vId);
        if (!hasOther) return false;
      }
      return true;
    });
  };

  return (
    <div className="space-y-5">
      {product.option_groups.map((group) => (
        <div key={group.id}>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2.5">
            {group.name}
            {selectedOptions[group.id] && (
              <span className="text-[var(--text-primary)] ml-2">
                : {group.values?.find((v) => v.id === selectedOptions[group.id])?.value}
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2.5">
            {group.values?.map((value) => {
              const isSelected = selectedOptions[group.id] === value.id;
              const available = isValueAvailable(group.id, value.id);

              if (isColorGroup(group) && value.color_hex) {
                return (
                  <button
                    key={value.id}
                    onClick={() => available && onOptionChange(group.id, value.id)}
                    className={`variant-swatch ${isSelected ? "selected" : ""} ${!available ? "opacity-30 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: value.color_hex }}
                    title={`${value.value}${!available ? " (Unavailable)" : ""}`}
                    disabled={!available}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-md">✓</span>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={value.id}
                  onClick={() => available && onOptionChange(group.id, value.id)}
                  className={`variant-btn ${isSelected ? "selected" : ""} ${!available ? "out-of-stock" : ""}`}
                  disabled={!available}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)]">SKU:</span>
          <span className="text-[var(--text-secondary)]">{selectedVariant.sku}</span>
          {selectedVariant.stock_quantity > 0 ? (
            <span className="badge bg-green-500/20 text-green-400 ml-2">In Stock ({selectedVariant.stock_quantity})</span>
          ) : (
            <span className="badge bg-red-500/20 text-red-400 ml-2">Out of Stock</span>
          )}
        </div>
      )}
    </div>
  );
}
