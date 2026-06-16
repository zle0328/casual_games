export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  total_games: number;
  dice_games: number;
  spy_games: number;
  spy_wins: number;
  win_rate?: number;
  created_at?: string;
}

export interface Room {
  room_code: string;
  game_type: 'dice' | 'spy';
  creator_id: string;
  status: 'waiting' | 'playing' | 'finished';
  settings: any;
  players?: RoomPlayer[];
}

export interface RoomPlayer {
  user_id: string;
  nickname: string;
  avatar?: string;
  role?: 'civilian' | 'spy' | 'blank';
  is_alive: number;
}

export interface GameRecord {
  id: string;
  room_code: string;
  game_type: 'dice' | 'spy';
  result: 'win' | 'lose' | 'draw';
  details: any;
  created_at: string;
}

export interface SpyWord {
  civilian: string;
  spy: string;
}
