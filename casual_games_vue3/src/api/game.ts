import { get, post } from '../utils/request';
import type { SpyWord } from '../types';

/**
 * 保存游戏结果
 */
export function saveGameResult(data: {
  room_code: string;
  user_id: string;
  game_type: 'dice' | 'spy';
  result: 'win' | 'lose' | 'draw';
  details?: any;
}) {
  return post<{ record_id: string }>('/api/game/result', data);
}

/**
 * 获取谁是卧底词条
 */
export function getSpyWords() {
  return get<{ words: SpyWord[] }>('/api/game/spy-words');
}

/**
 * 分配谁是卧底角色
 */
export function assignSpyRoles(data: {
  room_code: string;
  spy_count: number;
  blank_count?: number;
}) {
  return post<{ message: string; word: SpyWord }>('/api/game/spy-roles', data);
}

/**
 * 获取我的身份和词条
 */
export function getMyIdentity(roomCode: string, userId: string) {
  return get<{ role: 'civilian' | 'spy' | 'blank'; word: string | null }>(`/api/game/my-identity?room_code=${roomCode}&user_id=${userId}`);
}
