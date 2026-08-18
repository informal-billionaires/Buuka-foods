type Props = {
  restaurant: {
    name: string;
    is_open?: boolean | null;
    hours?: string | null;
    location?: string | null;
  };
  onEditClick?: () => void;
};

export default function RestaurantStatusCard({ restaurant, onEditClick }: Props) {
  const isOpen = !!restaurant.is_open;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-900">Restaurant Status</h2>
        {onEditClick && (
          <button onClick={onEditClick} className="text-sm text-primary font-medium">
            Edit
          </button>
        )}
      </div>

      <div className={`rounded-xl p-4 ${isOpen ? 'bg-green-50' : 'bg-neutral-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? 'bg-green-100' : 'bg-neutral-200'}`}>
            <span className="text-lg">🏪</span>
          </div>
          <div>
            <p className="text-sm text-neutral-600">
              Your restaurant is{' '}
              <span className={`font-semibold ${isOpen ? 'text-green-600' : 'text-neutral-500'}`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </p>
            {restaurant.hours && (
              <p className="text-xs text-neutral-500 mt-0.5">{restaurant.hours}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <p className="text-xs text-neutral-500">Opening hours</p>
          <p className="text-neutral-900 mt-0.5">{restaurant.hours ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Location</p>
          <p className="text-neutral-900 mt-0.5">{restaurant.location ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}