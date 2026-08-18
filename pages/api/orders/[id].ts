import type { NextApiRequest, NextApiResponse } from 'next';
import { orders } from '../../../data/orders';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method
  } = req;

  const orderId = Array.isArray(id) ? id[0] : id;
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (method === 'GET') {
    return res.status(200).json({ success: true, order: orders[idx] });
  }

  if (method === 'POST') {
    // handle actions: { action: 'cancel' } or { action: 'updateStatus', status: 'on_the_way' }
    const body = req.body || {};
    const action = body.action;

    if (action === 'cancel') {
      const current = orders[idx];
      if (current.status === 'pending' || current.status === 'preparing') {
        current.status = 'cancelled';
        return res.status(200).json({ success: true, order: current });
      } else {
        return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
      }
    }

    if (action === 'updateStatus') {
      const status = body.status;
      if (!status) return res.status(400).json({ success: false, message: 'Missing status' });
      orders[idx].status = status;
      return res.status(200).json({ success: true, order: orders[idx] });
    }

    return res.status(400).json({ success: false, message: 'Unknown action' });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${method} Not Allowed`);
}