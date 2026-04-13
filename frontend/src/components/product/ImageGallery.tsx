"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface GalleryImage {
  id?: string;
  image_url: string;
  is_primary?: boolean;
}

interface Props {
  images: GalleryImage[];
  alt: string;
  activeIndex?: number;
  onIndexChange?: (i: number) => void;
}

export default function ImageGallery({
  images,
  alt,
  activeIndex,
  onIndexChange,
}: Props) {
  const [internalIdx, setInternalIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const idx = activeIndex ?? internalIdx;
  const setIdx = onIndexChange ?? setInternalIdx;

  const currentImage = images[idx]?.image_url || "/placeholder-product.png";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const prev = () => setIdx(idx === 0 ? images.length - 1 : idx - 1);
  const next = () => setIdx(idx === images.length - 1 ? 0 : idx + 1);

  if (!images || images.length === 0) {
    return (
      <div className="gallery-main flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div
        className="gallery-main group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <Image
          src={currentImage}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300"
          style={
            zoomed
              ? {
                  transform: `scale(2)`,
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }
              : {}
          }
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={14} />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setIdx(i)}
              className={`gallery-thumb ${i === idx ? "active" : ""}`}
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
