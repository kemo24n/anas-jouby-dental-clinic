'use client';
import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';

export function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            onClick={() => setActive(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-orchid-50"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-5"
          onClick={() => setActive(null)}
          role="dialog"
          aria-label={images[active].alt}
        >
          <button aria-label="إغلاق" className="absolute left-5 top-5 rounded-lg p-2 text-white/80 hover:text-white">
            <X size={22} />
          </button>
          <div className="relative h-[70vh] w-full max-w-4xl">
            <Image src={images[active].src} alt={images[active].alt} fill sizes="90vw" className="rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
