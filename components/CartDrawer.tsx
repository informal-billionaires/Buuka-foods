import React from 'react';

export interface CartItem {
  key: string;
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  size?: string;
  customizations?: string[];
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  fulfillment: 'delivery' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  total: number;
  onUpdateQty: (key: string, qty: number) => void;
  onRemoveItem: (key: string) => void;
  onPlaceOrder: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  fulfillment,
  deliveryFee,
  subtotal,
  total,
  onUpdateQty,
  onRemoveItem,
  onPlaceOrder,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 bg-white shadow-2xl">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Your cart</h3>
              <div className="text-sm text-neutral-500 mt-1">{cart.reduce((s, c) => s + c.qty, 0)} item(s)</div>
            </div>
            <div>
              <button onClick={onClose} className="text-neutral-500">Close</button>
            </div>
          </div>

          <div className="mt-6 flex-1 overflow-auto space-y-4 pr-2">
            {cart.length === 0 && <div className="text-neutral-500">Your cart is empty.</div>}

            {cart.map(line => (
              <div key={line.key} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-neutral-900 truncate">{line.name}</div>
                      {line.size && <div className="text-xs text-neutral-500">· {line.size}</div>}
                    </div>
                    {line.customizations && line.customizations.length > 0 && (
                      <div className="text-xs text-neutral-500 mt-1">{line.customizations.join(', ')}</div>
                    )}
                  </div>

                  <div className="text-sm font-semibold text-neutral-900">₦{line.unitPrice * line.qty}</div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => onUpdateQty(line.key, Math.max(0, line.qty - 1))} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-700">−</button>
                  <div className="w-8 text-center text-neutral-900">{line.qty}</div>
                  <button onClick={() => onUpdateQty(line.key, line.qty + 1)} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-700">+</button>

                  <button onClick={() => onRemoveItem(line.key)} className="ml-auto text-sm text-rose-600">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <div>Subtotal</div>
              <div>₦{subtotal}</div>
            </div>

            <div className="flex items-center justify-between text-sm text-neutral-500 mt-2">
              <div>{fulfillment === 'delivery' ? 'Delivery fee' : 'Pickup'}</div>
              <div>{fulfillment === 'delivery' ? `₦${deliveryFee}` : 'Free'}</div>
            </div>

            <div className="flex items-center justify-between text-sm font-semibold text-neutral-900 mt-3">
              <div>Total</div>
              <div>₦{total}</div>
            </div>

            <div className="mt-4">
              <button
                disabled={cart.length === 0}
                onClick={onPlaceOrder}
                className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold ${cart.length === 0 ? 'bg-neutral-100 text-neutral-400' : 'bg-primary text-white'}`}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}