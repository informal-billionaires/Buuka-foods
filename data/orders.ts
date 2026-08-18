export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  img: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  eta?: number; // minutes
};

// export as let so API routes can mutate the array in-memory during dev
export let orders: Order[] = [
  {
    id: 'ORD-00123',
    items: [
      { name: 'Egusi & Pounded Yam', qty: 1, price: 2500, img: '/images/egusi.jpg' },
      { name: 'Plantain', qty: 1, price: 500, img: '/images/plantain.jpg' }
    ],
    total: 3000,
    status: 'on_the_way',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    eta: 12
  },
  {
    id: 'ORD-00124',
    items: [
      { name: 'Suya Skewers', qty: 2, price: 1200, img: '/images/suya.jpg' }
    ],
    total: 2400,
    status: 'preparing',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    eta: 20
  },
  {
    id: 'ORD-00125',
    items: [
      { name: 'Jollof Rice', qty: 1, price: 1800, img: '/images/jollof.jpg' }
    ],
    total: 1800,
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];