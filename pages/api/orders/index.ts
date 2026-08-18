import type { NextApiRequest, NextApiResponse } from 'next';
import { orders, Order } from '../../../data/orders';

function makeId() {
  return 'ORD-' + Math.floor(Date.now() / 1000).toString(36).toUpperCase();
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // return all orders
    return res.status(200).json({ success: true, orders });
  }

  if (req.method === 'POST') {
    // create a new order (reorder flow)
    try {
      const body = req.body;
      // expected shape: { items: OrderItem[], total: number, eta?: number }
      if (!body || !Array.isArray(body.items) || typeof body.total !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }

      const newOrder: Order = {
        id: makeId(),
        items: body.items,
        total: body.total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        eta: body.eta ?? null
      };

      orders.unshift(newOrder); // add to front
      return res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
