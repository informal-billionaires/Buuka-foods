import { supabase } from './supabaseClient';

export type Favorite = {
  id: string;
  restaurantId: string;
  createdAt: string;
};

export async function getFavorites(): Promise<Favorite[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('id, restaurant_id, created_at')
    .eq('customer_id', user.id);

  if (error || !data) {
    console.error('getFavorites failed', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    restaurantId: row.restaurant_id,
    createdAt: row.created_at,
  }));
}

export async function addFavorite(restaurantId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('favorites')
    .insert({ customer_id: user.id, restaurant_id: restaurantId });

  if (error) {
    console.error('addFavorite failed', error);
    return false;
  }
  return true;
}

export async function removeFavorite(restaurantId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('customer_id', user.id)
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error('removeFavorite failed', error);
    return false;
  }
  return true;
}

export type FavoriteRestaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  rating: number | null;
  cover: string | null;
};

export async function getFavoriteRestaurants(): Promise<FavoriteRestaurant[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('restaurant_id, restaurants ( id, name, cuisine, rating, cover )')
    .eq('customer_id', user.id);

  if (error || !data) {
    console.error('getFavoriteRestaurants failed', error);
    return [];
  }

  return data
    .map((row: any) => row.restaurants)
    .filter((r: any): r is FavoriteRestaurant => !!r);
}