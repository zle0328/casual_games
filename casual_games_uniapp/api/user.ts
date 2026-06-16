import { get, post } from '../utils/request';
import type { User, GameRecord } from '../types';

/**
 * 创建或获取用户
 */
export function createUser(data: { id?: string; nickname: string; avatar?: string }) {
  return post<User>('/api/user', data);
}

/**
 * 获取用户信息
 */
export function getUser(userId: string) {
  return get<User>(`/api/user/${userId}`);
}

/**
 * 获取用户游戏记录
 */
export function getUserRecords(userId: string, limit = 20) {
  return get<{ records: GameRecord[]; total: number }>(`/api/user/${userId}/records?limit=${limit}`);
}
