export interface Vendor {
  id: string;
  business_name: string;
  cuisine?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string | null;
  description?: string | null;
  location?: string | null;
  hours?: string | null;
  cover?: string | null;
  logo?: string | null;
  vendor_id: string;
  rating?: number | null;
  delivery_time?: number | null;
  distance?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  price_level?: string | null;
  is_open?: boolean | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category?: string | null;
  name: string;
  description?: string | null;
  base_price: number;
  image?: string | null;
}