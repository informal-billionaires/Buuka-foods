import React from 'react';

export interface FulfillmentToggleProps {
  value: 'delivery' | 'pickup';
  onChange: (v: 'delivery' | 'pickup') => void;
}

export default function FulfillmentToggle({ value, onChange }: FulfillmentToggleProps) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="text-sm text-neutral-400 mr-2">Fulfillment</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('delivery')}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${value === 'delivery' ? 'bg-primary text-neutral-black' : 'bg-neutral-white/5 text-neutral-white/90'}`}
        >
          Delivery
        </button>
        <button
          onClick={() => onChange('pickup')}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${value === 'pickup' ? 'bg-primary text-neutral-black' : 'bg-neutral-white/5 text-neutral-white/90'}`}
        >
          Pickup
        </button>
      </div>
    </div>
  );
}