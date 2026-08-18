import React, { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { MenuItem } from './types';

export interface MenuItemListProps {
  items: MenuItem[];
  onUpdated: (item: MenuItem) => void;
  onDeleted: (id: string) => void;
}

export default function MenuItemList({ items, onUpdated, onDeleted }: MenuItemListProps) {
  const grouped = useMemo(() => {
    return items.reduce<Record<string, MenuItem[]>>((acc, it) => {
      const cat = it.category?.trim() || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(it);
      return acc;
    }, {});
  }, [items]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    name: '',
    description: '',
    base_price: '',
    image: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: MenuItem) {
    setEditForm({
      category: item.category || '',
      name: item.name || '',
      description: item.description || '',
      base_price: String(item.base_price ?? ''),
      image: item.image || '',
    });
    setError(null);
    setEditingItemId(item.id);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setError(null);
  }

  function updateEdit<K extends keyof typeof editForm>(k: K, v: string) {
    setEditForm(prev => ({ ...prev, [k]: v }));
  }

  async function saveEdit(itemId: string) {
    setError(null);
    if (!editForm.name.trim() || editForm.base_price === '') {
      setError('Name and base price required.');
      return;
    }

    const priceNum = Number(editForm.base_price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Please provide a valid base price.');
      return;
    }

    setSavingId(itemId);
    try {
      const payload = {
        category: editForm.category.trim() || null,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        base_price: priceNum,
        image: editForm.image.trim() || null,
      };

      const { data: updated, error: updateErr } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', itemId)
        .select()
        .single();

      if (updateErr) {
        setError(updateErr.message || 'Failed to update item');
        return;
      }

      if (updated) {
        onUpdated(updated as MenuItem);
        setEditingItemId(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error updating item');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this item?')) return;
    setDeletingId(itemId);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (delErr) {
        setError(delErr.message || 'Failed to delete item');
        return;
      }

      onDeleted(itemId);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error deleting item');
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return <div className="text-neutral-400">No menu items yet. Add your first item above.</div>;
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-rose-400">{error}</div>}

      {Object.entries(grouped).map(([category, itemsInCat]) => (
        <div key={category} className="bg-neutral-900/40 rounded-xl p-4">
          <div className="text-sm font-semibold mb-3">{category}</div>
          <div className="space-y-3">
            {itemsInCat.map(it => {
              const isEditing = editingItemId === it.id;
              if (!isEditing) {
                return (
                  <div key={it.id} className="flex items-start justify-between gap-3 bg-neutral-950 rounded-md p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{it.name}</div>
                      {it.description && <div className="text-xs text-neutral-400 mt-1">{it.description}</div>}
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-xs text-neutral-400">Your price</div>
                      <div className="text-sm font-semibold">₦{it.base_price}</div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => startEdit(it)}
                          className="px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(it.id)}
                          disabled={deletingId === it.id}
                          className="px-3 py-1.5 rounded-full bg-neutral-white/5 text-sm text-rose-400"
                        >
                          {deletingId === it.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>

                      {it.image && <img src={it.image} alt={it.name} className="mt-2 w-28 h-16 object-cover rounded-md" />}
                    </div>
                  </div>
                );
              }

              return (
                <div key={it.id} className="bg-neutral-950 rounded-md p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={editForm.category}
                      onChange={(e) => updateEdit('category', e.target.value)}
                      placeholder="Category"
                      className="px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                    />
                    <input
                      value={editForm.name}
                      onChange={(e) => updateEdit('name', e.target.value)}
                      placeholder="Item name"
                      className="px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                    />
                    <input
                      value={editForm.base_price}
                      onChange={(e) => updateEdit('base_price', e.target.value)}
                      placeholder="Base price"
                      type="number"
                      min={0}
                      className="px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <input
                      value={editForm.image}
                      onChange={(e) => updateEdit('image', e.target.value)}
                      placeholder="Image URL (optional)"
                      className="px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                    />
                    <input
                      value={editForm.description}
                      onChange={(e) => updateEdit('description', e.target.value)}
                      placeholder="Short description (optional)"
                      className="px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => saveEdit(it.id)}
                      disabled={savingId === it.id}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${savingId === it.id ? 'bg-neutral-white/5 text-neutral-500' : 'bg-primary text-black'}`}
                    >
                      {savingId === it.id ? 'Saving…' : 'Save'}
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-full text-sm bg-neutral-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}