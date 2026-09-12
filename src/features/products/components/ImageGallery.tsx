import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import type { StorefrontImage } from '@/types/product';
import { cn } from '@/utils/cn';

interface ImageGalleryProps {
  images: StorefrontImage[];
  title: string;
  /** Image shown in the main frame; the parent owns it so variant changes can swap it. */
  selected: StorefrontImage | null;
  onSelect: (image: StorefrontImage) => void;
}

export function ImageGallery({ images, title, selected, onSelect }: ImageGalleryProps) {
  const [zoomed, setZoomed] = useState(false);
  const current = selected ?? images[0] ?? null;

  return (
    <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
      <div className="hide-scrollbar order-2 flex gap-2 overflow-auto sm:order-1 sm:flex-col">
        {images.map((image, index) => (
          <button
            key={image.url}
            className={cn(
              'focus-ring aspect-square min-w-18 overflow-hidden rounded-2xl border bg-ink-100 dark:bg-ink-800',
              current?.url === image.url ? 'border-moss-600' : 'border-transparent',
            )}
            onClick={() => onSelect(image)}
            aria-label={`View image ${index + 1} of ${images.length}`}
            aria-pressed={current?.url === image.url}
          >
            <ProductImage className="h-full w-full" image={image} alt="" sizes="5rem" />
          </button>
        ))}
      </div>
      <button
        className="focus-ring group relative isolate order-1 aspect-square overflow-hidden rounded-3xl bg-ink-100 sm:order-2 dark:bg-ink-800"
        onClick={() => setZoomed(true)}
        aria-label={`Zoom image of ${title}`}
      >
        <ProductImage
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
          image={current}
          alt={title}
          sizes="(min-width: 1024px) 40rem, 100vw"
          priority
        />
        <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-white/90 text-ink-900 shadow-sm">
          <Maximize2 className="size-4" />
        </span>
      </button>
      {zoomed ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/95 p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Zoomed image of ${title}`}
        >
          <Button
            className="absolute top-5 right-5 border-white/20 bg-white/10 text-white hover:bg-white/20"
            size="icon"
            variant="secondary"
            onClick={() => setZoomed(false)}
            aria-label="Close image zoom"
          >
            <X className="size-5" />
          </Button>
          <ProductImage
            className="h-auto max-h-[88vh] w-auto max-w-[92vw]"
            image={current}
            alt={title}
            sizes="92vw"
            fit="contain"
            priority
          />
        </div>
      ) : null}
    </div>
  );
}
