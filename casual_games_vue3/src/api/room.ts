import { get, post } from '../utils/request';
import type { Room } from '../types';

/**
 * 创建房间
 */
export function createRoom(data: {
  creator_id: string;
  game_type: 'dice' | 'spy';
  settings?: any;
}) {
  return post<Room>('/api/room', data);
}

/**
 * 加入房间
 */
export function joinRoom(data: { room_code: string; user_id: string }) {
  return post<{ message: string }>('/api/room/join', data);
}

/**
 * 获取房间信息
 */
export function getRoom(roomCode: string) {
  return get<Room>(`/api/room/${roomCode}`);
}

/**
 * 开始游戏
 */
export function startGame(data: { room_code: string; user_id: string }) {
  return post<{ message: string }>('/api/room/start', data);
}
