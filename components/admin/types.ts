export interface AdminRow {
  id: string;
  email?: string | null;
  created_at?: string | null;
}

export interface Vendor {
  id: string;
  business_name?: string | null;
  cuisine?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null;
  created_at?: string | null;
}

export interface Margin {
  id?: string;
  vendor_id: string;
  percentage: number;
  set_by?: string | null;
  created_at?: string | null;
}