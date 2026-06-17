import type { Env } from '../types';
import { jsonResponse, errorResponse, parseJsonBody, generateId } from '../utils/helpers';

/**
 * 保存游戏结果
 */
export async function handleSaveGameResult(request: Request, env: Env) {
  const body = await parseJsonBody<{
    room_code: string;
    user_id: string;
    game_type: 'dice' | 'spy';
    result: 'win' | 'lose' | 'draw';
    details: any;
  }>(request);

  if (!body || !body.room_code || !body.user_id || !body.game_type) {
    return errorResponse('参数不完整', 400);
  }

  const recordId = generateId('record');

  try {
    // 保存游戏记录
    await env.DB.prepare(
      'INSERT INTO game_records (id, room_code, user_id, game_type, result, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      recordId,
      body.room_code,
      body.user_id,
      body.game_type,
      body.result || 'draw',
      JSON.stringify(body.details || {})
    ).run();

    // 更新用户统计
    if (body.game_type === 'dice') {
      await env.DB.prepare(
        'UPDATE users SET total_games = total_games + 1, dice_games = dice_games + 1 WHERE id = ?'
      ).bind(body.user_id).run();
    } else if (body.game_type === 'spy') {
      const winIncrement = body.result === 'win' ? 1 : 0;
      await env.DB.prepare(
        'UPDATE users SET total_games = total_games + 1, spy_games = spy_games + 1, spy_wins = spy_wins + ? WHERE id = ?'
      ).bind(winIncrement, body.user_id).run();
    }

    return jsonResponse({ record_id: recordId }, 201);
  } catch (error) {
    console.error('Save game result error:', error);
    return errorResponse('保存游戏结果失败', 500);
  }
}

/**
 * 获取谁是卧底词条（从KV读取）
 */
export async function handleGetSpyWords(env: Env) {
  try {
    // 尝试从KV读取
    const cached = await env.KV.get('spy_words', 'json');
    if (cached) {
      return jsonResponse(cached);
    }

    // 返回默认词条库
    const defaultWords = [
      { civilian: '包子', spy: '饺子' },
      { civilian: '牛奶', spy: '豆浆' },
      { civilian: '西瓜', spy: '冬瓜' },
      { civilian: '手机', spy: '座机' },
      { civilian: '眉毛', spy: '睫毛' },
      { civilian: '作家', spy: '诗人' },
      { civilian: '玫瑰', spy: '月季' },
      { civilian: '汽车', spy: '火车' },
      { civilian: '状元', spy: '冠军' },
      { civilian: '饼干', spy: '薯片' },
    ];

    return jsonResponse({ words: defaultWords });
  } catch (error) {
    console.error('Get spy words error:', error);
    return errorResponse('获取词条失败', 500);
  }
}

/**
 * 获取我的身份和词条
 */
export async function handleGetMyIdentity(roomCode: string, userId: string, env: Env) {
  try {
    const player = await env.DB.prepare(
      'SELECT role, word FROM room_players WHERE room_code = ? AND user_id = ?'
    ).bind(roomCode, userId).first();

    if (!player) {
      return errorResponse('玩家不在房间中', 404);
    }

    if (!player.role) {
      return errorResponse('角色尚未分配', 400);
    }

    return jsonResponse({
      role: player.role,
      word: player.word,
    });
  } catch (error) {
    console.error('Get my identity error:', error);
    return errorResponse('获取身份失败', 500);
  }
}
export async function handleAssignSpyRoles(request: Request, env: Env) {
  const body = await parseJsonBody<{
    room_code: string;
    spy_count: number;
    blank_count?: number;
  }>(request);

  if (!body || !body.room_code || !body.spy_count) {
    return errorResponse('参数不完整', 400);
  }

  try {
    // 获取房间玩家
    const { results: players } = await env.DB.prepare(
      'SELECT user_id FROM room_players WHERE room_code = ?'
    ).bind(body.room_code).all();

    if (players.length < 3) {
      return errorResponse('玩家人数不足', 400);
    }

    const totalPlayers = players.length;
    const spyCount = body.spy_count;
    const blankCount = body.blank_count || 0;

    if (spyCount + blankCount >= totalPlayers) {
      return errorResponse('卧底和白板数量过多', 400);
    }

    // 随机分配角色
    const roles: string[] = [
      ...Array(spyCount).fill('spy'),
      ...Array(blankCount).fill('blank'),
      ...Array(totalPlayers - spyCount - blankCount).fill('civilian'),
    ];

    // Fisher-Yates 洗牌
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // 随机选择词条
    const wordsData = await handleGetSpyWords(env);
    const wordsResponse = await wordsData.json();
    const words = wordsResponse.data.words || wordsResponse.data;
    const selectedWord = words[Math.floor(Math.random() * words.length)];

    // 更新玩家角色和词条
    for (let i = 0; i < players.length; i++) {
      const role = roles[i];
      let word = null;

      if (role === 'spy') {
        word = selectedWord.spy;
      } else if (role === 'civilian') {
        word = selectedWord.civilian;
      }
      // blank 角色 word 保持 null

      await env.DB.prepare(
        'UPDATE room_players SET role = ?, word = ? WHERE room_code = ? AND user_id = ?'
      ).bind(role, word, body.room_code, players[i].user_id).run();
    }

    return jsonResponse({
      message: '角色分配成功',
      word: selectedWord,
    });
  } catch (error) {
    console.error('Assign spy roles error:', error);
    return errorResponse('分配角色失败', 500);
  }
}
