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

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  time: string;
  read: boolean;
}

export interface Password {
  id: string;
  user_id: string;
  website_name: string;
  website_url?: string;
  email: string;
  password: string;
  notes?: string;
  category?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CanvasBoard {
  id: string;
  user_id: string;
  name: string;
  background_color: string;
  is_dark_mode: boolean;
  parent_board_id?: string;
  tldraw_snapshot?: any;
  created_at: string;
  updated_at: string;
}

export interface CanvasElement {
  id: string;
  board_id: string;
  type: 'note' | 'image' | 'link' | 'file' | 'todo' | 'column' | 'board_link' | 'text' | 'sketch' | 'heading' | 'code';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  content: any; // Dynamic properties depending on the element type
  created_at: string;
  updated_at: string;
}

export interface CanvasConnector {
  id: string;
  board_id: string;
  source_element_id: string;
  target_element_id: string;
  color: string;
  label?: string;
  style: 'straight' | 'curved';
  created_at: string;
}

