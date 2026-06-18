import apiHandler from '../../../casual_games_backend/src/index';
import type { Env } from '../../../casual_games_backend/src/types';

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  return apiHandler.fetch(request, env);
};
