export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  total_games: number;
  dice_games: number;
  spy_games: number;
  spy_wins: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  room_code: string;
  game_type: 'dice' | 'spy';
  creator_id: string;
  status: 'waiting' | 'playing' | 'finished';
  settings: string; // JSON string
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface RoomPlayer {
  id: number;
  room_code: string;
  user_id: string;
  role?: 'civilian' | 'spy' | 'blank';
  is_alive: number;
  joined_at: string;
}

export interface GameRecord {
  id: string;
  room_code: string;
  user_id: string;
  game_type: 'dice' | 'spy';
  result: 'win' | 'lose' | 'draw';
  details: string; // JSON string
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
