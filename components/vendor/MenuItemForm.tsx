import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { MenuItem } from './types';

export interface MenuItemFormProps {
  restaurantId: string;
  onAdded: (item: MenuItem) => void;
}

export default function MenuItemForm({ restaurantId, onAdded }: MenuItemFormProps) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || basePrice === '') {
      setError('Name and base price required.');
      return;
    }

    const priceNum = Number(basePrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Please provide a valid base price.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        category: category.trim() || null,
        name: name.trim(),
        description: description.trim() || null,
        base_price: priceNum,
        image: image.trim() || null,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from<MenuItem>('menu_items')
        .insert(payload)
        .select()
        .single();

      if (insertErr) {
        setError(insertErr.message || 'Failed to add item');
        return;
      }

      if (inserted) {
        onAdded(inserted);
        setCategory('');
        setName('');
        setDescription('');
        setBasePrice('');
        setImage('');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error adding item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/40 rounded-xl p-4 space-y-3">
      <div className="text-sm font-semibold">Add item</div>

      {error && <div className="text-sm text-rose-400">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
        />
        <input
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder="Base price"
          type="number"
          min={0}
          className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="px-3 py-2 rounded-md bg-white border border-neutral-200 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`px-4 py-2 rounded-full text-sm font-semibold ${saving ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
      >
        {saving ? 'Adding…' : 'Add item'}
      </button>
    </form>
  );
}