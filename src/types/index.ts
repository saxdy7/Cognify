export interface Container {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  container_id?: string;
  url: string;
  title?: string;
  description?: string;
  logo_url?: string;
  preview_image_url?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  metadata_json?: any;
  ai_summary?: string;
  is_favorite: boolean;
  created_at: string;
}
