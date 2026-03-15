export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  reward_points: number;
  total_visits: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  state: string;
  city: string;
  category_id: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  rating: number;
  visit_count: number;
  best_season: string;
  created_at: string;
}

export interface UserVisit {
  id: string;
  user_id: string;
  location_id: string;
  visited_at: string;
  points_earned: number;
  rating: number | null;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  location_id: string;
  created_at: string;
}
