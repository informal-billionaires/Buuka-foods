import React from 'react';

export default function ProductCard({
  title,
  img,
  price,
  restaurantName,
  onClick,
  rating,
}: {
  title: string;
  img: string;
  price: number;
  restaurantName: string;
  onClick?: () => void;
  rating?: number;
}) {
  const imageSrc = img || '/images/placeholder-food.jpg';

  function formatNaira(n: number) {
    return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="rounded-2xl bg-white shadow-md overflow-hidden cursor-pointer hover:shadow-lg"
    >
      <div className="relative h-44">
        <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
        <div className="absolute right-3 top-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center text-sm">♡</div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-neutral-500">
            {typeof rating === 'number' ? `${rating.toFixed(1)}★` : formatNaira(price)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-neutral-500">{restaurantName ?? '—'}</div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="bg-primary text-black px-3 py-1 rounded-full"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}