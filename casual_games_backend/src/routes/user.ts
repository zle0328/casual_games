import type { Env } from '../types';
import { jsonResponse, errorResponse, parseJsonBody, generateId } from '../utils/helpers';

/**
 * 创建或获取用户
 */
export async function handleCreateUser(request: Request, env: Env) {
  const body = await parseJsonBody<{ id?: string; nickname: string; avatar?: string }>(request);

  if (!body || !body.nickname) {
    return errorResponse('昵称不能为空', 400);
  }

  const userId = body.id || generateId('user');

  try {
    // 检查用户是否存在
    const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    if (existing) {
      return jsonResponse(existing);
    }

    // 创建新用户
    await env.DB.prepare(
      'INSERT INTO users (id, nickname, avatar) VALUES (?, ?, ?)'
    ).bind(userId, body.nickname, body.avatar || null).run();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    return jsonResponse(user, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse('创建用户失败', 500);
  }
}

/**
 * 获取用户信息
 */
export async function handleGetUser(userId: string, env: Env) {
  try {
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    // 计算胜率
    const winRate = user.spy_games > 0
      ? Math.round((user.spy_wins / user.spy_games) * 100)
      : 0;

    return jsonResponse({
      ...user,
      win_rate: winRate,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('获取用户信息失败', 500);
  }
}

/**
 * 获取用户游戏记录
 */
export async function handleGetUserRecords(userId: string, env: Env, limit = 20) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM game_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, limit).all();

    return jsonResponse({
      records: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Get user records error:', error);
    return errorResponse('获取游戏记录失败', 500);
  }
}
