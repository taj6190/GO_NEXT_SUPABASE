"use client";

import { Star } from "lucide-react";

interface Props {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  count?: number;
}

export default function StarRating({ rating, maxRating = 5, size = 16, interactive = false, onChange, showValue = false, count }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="star-rating">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;
          return (
            <button
              key={i}
              type="button"
              className={`star ${filled || half ? "filled" : ""} ${interactive ? "interactive" : ""}`}
              onClick={() => interactive && onChange?.(i + 1)}
              disabled={!interactive}
              style={{ background: "none", border: "none", padding: "1px" }}
            >
              <Star
                size={size}
                fill={filled ? "var(--star-filled)" : half ? "url(#halfGrad)" : "none"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold text-[var(--star-filled)]">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-[var(--text-muted)]">({count})</span>}
    </div>
  );
}
