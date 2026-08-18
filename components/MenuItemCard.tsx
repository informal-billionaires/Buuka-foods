import React from 'react';

export default function MenuItemCard({ item, onAdd }: {
  item: { id?: string; name?: string; description?: string; price?: number | string; image?: string };
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-start gap-4 bg-neutral-800/40 rounded-xl p-4">
      {/* left: optional image */}
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">No image</div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-semibold truncate">{item.name}</h3>
          {typeof item.price !== 'undefined' && <div className="text-sm font-semibold text-white">{typeof item.price === 'number' ? `₦${item.price}` : item.price}</div>}
        </div>

        {item.description && <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{item.description}</p>}

        <div className="mt-3">
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-black text-sm font-semibold">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}