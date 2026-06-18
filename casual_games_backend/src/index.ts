import type { Env } from './types';
import { corsResponse, errorResponse } from './utils/helpers';
import { handleCreateUser, handleGetUser, handleGetUserRecords } from './routes/user';
import { handleCreateRoom, handleJoinRoom, handleGetRoom, handleStartGame } from './routes/room';
import { handleSaveGameResult, handleGetSpyWords, handleAssignSpyRoles, handleGetMyIdentity, handleRestartSpyGame } from './routes/game';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    try {
      // 用户相关接口
      if (url.pathname === '/api/user' && request.method === 'POST') {
        return handleCreateUser(request, env);
      }
      if (url.pathname.match(/^\/api\/user\/([^/]+)$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        return handleGetUser(userId, env);
      }
      if (url.pathname.match(/^\/api\/user\/([^/]+)\/records$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        const limit = parseInt(url.searchParams.get('limit') || '20');
        return handleGetUserRecords(userId, env, limit);
      }

      // 房间相关接口
      if (url.pathname === '/api/room' && request.method === 'POST') {
        return handleCreateRoom(request, env);
      }
      if (url.pathname === '/api/room/join' && request.method === 'POST') {
        return handleJoinRoom(request, env);
      }
      if (url.pathname.match(/^\/api\/room\/([^/]+)$/) && request.method === 'GET') {
        const roomCode = url.pathname.split('/')[3];
        return handleGetRoom(roomCode, env);
      }
      if (url.pathname === '/api/room/start' && request.method === 'POST') {
        return handleStartGame(request, env);
      }

      // 游戏相关接口
      if (url.pathname === '/api/game/result' && request.method === 'POST') {
        return handleSaveGameResult(request, env);
      }
      if (url.pathname === '/api/game/spy-words' && request.method === 'GET') {
        return handleGetSpyWords(env);
      }
      if (url.pathname === '/api/game/spy-roles' && request.method === 'POST') {
        return handleAssignSpyRoles(request, env);
      }
      if (url.pathname === '/api/game/spy-restart' && request.method === 'POST') {
        return handleRestartSpyGame(request, env);
      }
      if (url.pathname.match(/^\/api\/game\/my-identity$/) && request.method === 'GET') {
        const roomCode = url.searchParams.get('room_code');
        const userId = url.searchParams.get('user_id');
        if (!roomCode || !userId) {
          return errorResponse('参数不完整', 400);
        }
        return handleGetMyIdentity(roomCode, userId, env);
      }

      // 健康检查
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return errorResponse('接口不存在', 404);
    } catch (error) {
      console.error('Server error:', error);
      return errorResponse('服务器错误', 500);
    }
  },
};
