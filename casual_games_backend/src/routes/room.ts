import type { Env } from '../types';
import { jsonResponse, errorResponse, parseJsonBody, generateRoomCode, generateId } from '../utils/helpers';

/**
 * 创建房间
 */
export async function handleCreateRoom(request: Request, env: Env) {
  const body = await parseJsonBody<{
    creator_id: string;
    game_type: 'dice' | 'spy';
    settings: any;
  }>(request);

  if (!body || !body.creator_id || !body.game_type) {
    return errorResponse('参数不完整', 400);
  }

  const roomCode = generateRoomCode();

  try {
    await env.DB.prepare(
      'INSERT INTO rooms (room_code, game_type, creator_id, settings) VALUES (?, ?, ?, ?)'
    ).bind(
      roomCode,
      body.game_type,
      body.creator_id,
      JSON.stringify(body.settings || {})
    ).run();

    // 创建者加入房间
    await env.DB.prepare(
      'INSERT INTO room_players (room_code, user_id) VALUES (?, ?)'
    ).bind(roomCode, body.creator_id).run();

    return jsonResponse({
      room_code: roomCode,
      game_type: body.game_type,
      creator_id: body.creator_id,
      status: 'waiting',
    }, 201);
  } catch (error) {
    console.error('Create room error:', error);
    return errorResponse('创建房间失败', 500);
  }
}

/**
 * 加入房间
 */
export async function handleJoinRoom(request: Request, env: Env) {
  const body = await parseJsonBody<{ room_code: string; user_id: string }>(request);

  if (!body || !body.room_code || !body.user_id) {
    return errorResponse('参数不完整', 400);
  }

  try {
    // 检查房间是否存在
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE room_code = ?')
      .bind(body.room_code)
      .first();

    if (!room) {
      return errorResponse('房间不存在', 404);
    }

    if (room.status !== 'waiting') {
      return errorResponse('房间已开始游戏', 400);
    }

    // 检查是否已加入
    const existing = await env.DB.prepare(
      'SELECT * FROM room_players WHERE room_code = ? AND user_id = ?'
    ).bind(body.room_code, body.user_id).first();

    if (existing) {
      return jsonResponse({ message: '已在房间中' });
    }

    // 加入房间
    await env.DB.prepare(
      'INSERT INTO room_players (room_code, user_id) VALUES (?, ?)'
    ).bind(body.room_code, body.user_id).run();

    return jsonResponse({ message: '加入成功' });
  } catch (error) {
    console.error('Join room error:', error);
    return errorResponse('加入房间失败', 500);
  }
}

/**
 * 获取房间信息
 */
export async function handleGetRoom(roomCode: string, env: Env) {
  try {
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE room_code = ?')
      .bind(roomCode)
      .first();

    if (!room) {
      return errorResponse('房间不存在', 404);
    }

    // 获取房间玩家
    const { results: players } = await env.DB.prepare(
      `SELECT rp.*, u.nickname, u.avatar
       FROM room_players rp
       LEFT JOIN users u ON rp.user_id = u.id
       WHERE rp.room_code = ?`
    ).bind(roomCode).all();

    return jsonResponse({
      ...room,
      settings: JSON.parse(room.settings as string || '{}'),
      players,
    });
  } catch (error) {
    console.error('Get room error:', error);
    return errorResponse('获取房间信息失败', 500);
  }
}

/**
 * 开始游戏
 */
export async function handleStartGame(request: Request, env: Env) {
  const body = await parseJsonBody<{ room_code: string; user_id: string }>(request);

  if (!body || !body.room_code || !body.user_id) {
    return errorResponse('参数不完整', 400);
  }

  try {
    const room = await env.DB.prepare('SELECT * FROM rooms WHERE room_code = ?')
      .bind(body.room_code)
      .first();

    if (!room) {
      return errorResponse('房间不存在', 404);
    }

    if (room.creator_id !== body.user_id) {
      return errorResponse('只有房主可以开始游戏', 403);
    }

    if (room.status !== 'waiting') {
      return errorResponse('游戏已开始', 400);
    }

    // 更新房间状态
    await env.DB.prepare(
      'UPDATE rooms SET status = ?, started_at = CURRENT_TIMESTAMP WHERE room_code = ?'
    ).bind('playing', body.room_code).run();

    return jsonResponse({ message: '游戏开始' });
  } catch (error) {
    console.error('Start game error:', error);
    return errorResponse('开始游戏失败', 500);
  }
}
