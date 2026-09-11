import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { cn } from '@/utils/cn';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selected, setSelected] = useState(images[0] ?? '');
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
      <div className="hide-scrollbar order-2 flex gap-2 overflow-auto sm:order-1 sm:flex-col">
        {images.map((image, index) => (
          <button
            key={image}
            className={cn(
              'focus-ring aspect-square min-w-18 overflow-hidden rounded-2xl border bg-ink-100 p-1 dark:bg-ink-800',
              selected === image ? 'border-moss-600' : 'border-transparent',
            )}
            onClick={() => setSelected(image)}
            aria-label={`View image ${index + 1} of ${images.length}`}
          >
            <ProductImage className="h-full w-full" src={image} />
          </button>
        ))}
      </div>
      <button
        className="focus-ring group relative isolate order-1 aspect-square overflow-hidden rounded-3xl bg-ink-100 p-8 sm:order-2 dark:bg-ink-800"
        onClick={() => setZoomed(true)}
        aria-label={`Zoom image of ${title}`}
      >
        <ProductImage
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
          src={selected}
          alt={title}
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
            src={selected}
            alt={title}
            priority
          />
        </div>
      ) : null}
    </div>
  );
}
