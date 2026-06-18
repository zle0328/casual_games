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

/**
 * 再来一局（仅房主）
 * 后端重新随机分配卧底角色与词条，并刷新局数版本戳，
 * 各成员端轮询时据此自动拉取新身份。
 */
export function restartSpyGame(data: { room_code: string; user_id: string }) {
  return post<{ message: string; round_key: string }>('/api/game/spy-restart', data);
}
