import React, { useMemo, useState } from 'react';
import { PricedMenuItem } from '../lib/restaurants';

export interface MenuItemRowConfirmPayload {
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  size?: string;
  customizations?: string[];
}

export interface MenuItemRowProps {
  item: PricedMenuItem;
  openPanelItemId: string | null;
  setOpenPanelItemId: (id: string | null) => void;
  onConfirm: (payload: MenuItemRowConfirmPayload) => void;
}

export default function MenuItemRow({ item, openPanelItemId, setOpenPanelItemId, onConfirm }: MenuItemRowProps) {
  const itemId = item.id || String(item.name);
  console.log('MenuItemRow itemId:', itemId, 'item.id:', item.id, 'item.name:', item.name);
  const sizes = item.sizes || [];
  const hasCustomizations = !!(item.customizations && item.customizations.length > 0);

  // Local state owned by this component
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(() => (sizes.length ? 0 : -1));
  const [panelQty, setPanelQty] = useState<number>(1);
  const [panelSelectedCustomizations, setPanelSelectedCustomizations] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (item.customizations || []).forEach(c => { map[c.label] = false; });
    return map;
  });

  // displayed price respects selectedSizeIndex locally
  const displayedPrice = useMemo(() => {
    const base = Number(item.price || 0);
    const sizeMod = (selectedSizeIndex >= 0 && sizes[selectedSizeIndex]) ? Number(sizes[selectedSizeIndex].priceModifier || 0) : 0;
    return base + sizeMod;
  }, [item.price, selectedSizeIndex, sizes]);

  function openPanel() {
    setPanelQty(1);
    setPanelSelectedCustomizations((prev) => {
      // reset selections
      const initial: Record<string, boolean> = {};
      (item.customizations || []).forEach(c => { initial[c.label] = false; });
      return initial;
    });
    setOpenPanelItemId(itemId);
  }

  function toggleCustomization(label: string) {
    setPanelSelectedCustomizations(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function handleDirectAdd() {
    if (hasCustomizations) {
      openPanel();
      return;
    }
    // no customizations: add directly with current size selection (if any)
    const sizeLabel = selectedSizeIndex >= 0 && sizes[selectedSizeIndex] ? sizes[selectedSizeIndex].label : undefined;
    const sizeModifier = selectedSizeIndex >= 0 && sizes[selectedSizeIndex] ? Number(sizes[selectedSizeIndex].priceModifier || 0) : 0;
    const unitPrice = Number(item.price || 0) + sizeModifier;
    onConfirm({ itemId, name: item.name || '', unitPrice, qty: 1, size: sizeLabel, customizations: [] });
  }

  function confirmPanel() {
    const selectedCustomizations = Object.keys(panelSelectedCustomizations).filter(k => panelSelectedCustomizations[k]);
    const sizeLabel = selectedSizeIndex >= 0 && sizes[selectedSizeIndex] ? sizes[selectedSizeIndex].label : undefined;
    const sizeModifier = selectedSizeIndex >= 0 && sizes[selectedSizeIndex] ? Number(sizes[selectedSizeIndex].priceModifier || 0) : 0;
    const base = Number(item.price || 0);
    const customPrice = selectedCustomizations.reduce((sum, label) => {
      const cs = (item.customizations || []).find(c => c.label === label);
      return sum + (cs && cs.priceModifier ? Number(cs.priceModifier) : 0);
    }, 0);
    const unitPrice = base + sizeModifier + customPrice;
    onConfirm({ itemId, name: item.name || '', unitPrice, qty: panelQty, size: sizeLabel, customizations: selectedCustomizations });
    // close panel and reset panel state
    setOpenPanelItemId(null);
    setPanelQty(1);
    setPanelSelectedCustomizations((prev) => {
      const initial: Record<string, boolean> = {};
      (item.customizations || []).forEach(c => { initial[c.label] = false; });
      return initial;
    });
  }

  return (
    <div className="bg-neutral-800/40 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img src={item.image || '/images/placeholder-food.jpg'} alt={item.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-sm font-semibold truncate">{item.name}</h3>
            <div className="text-sm font-semibold text-white">₦{displayedPrice}</div>
          </div>

          {item.description && <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{item.description}</p>}

          {sizes.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {sizes.map((s, idx) => {
                const selected = selectedSizeIndex === idx;
                return (
                  <button
                    key={s.label + idx}
                    type="button"
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${selected ? 'bg-primary text-neutral-black' : 'bg-neutral-white/5 text-neutral-white/90'}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div />
            <div>
              <button
                onClick={handleDirectAdd}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-black text-sm font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline customization panel */}
      {openPanelItemId === itemId && hasCustomizations && (
        <div className="mt-3 p-4 bg-neutral-900 rounded-md border border-neutral-800">
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-medium mb-2">Customizations</div>
              <div className="flex gap-2 flex-wrap">
                {(item.customizations || []).map((c) => (
                  <label key={c.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!panelSelectedCustomizations[c.label]}
                      onChange={() => toggleCustomization(c.label)}
                    />
                    <span>{c.label}{c.priceModifier ? ` (+₦${c.priceModifier})` : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm">Quantity</div>
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPanelQty(q => Math.max(1, q - 1))}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-white/5"
                >
                  −
                </button>
                <div className="w-8 text-center">{panelQty}</div>
                <button
                  onClick={() => setPanelQty(q => q + 1)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-white/5"
                >
                  +
                </button>
              </div>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => { setOpenPanelItemId(null); }}
                  className="px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPanel}
                  className="px-3 py-1.5 rounded-full bg-primary text-black text-sm font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}