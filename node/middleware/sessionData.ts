import express from 'express';
import { asyncHandler, saveSession, sendData, sendNoContent } from '../express';
import { requireBodyZod, requireQueryZod } from '../middleware';
import { z } from 'zod';

/**
 * セッションデータを管理するミドルウェアを作成します
 * @param basePath ベースパス（デフォルト: '/api/session'）
 * @returns Express Router
 * 
 * @example
 * // サーバー側での使用
 * import { sessionDataMiddleware } from 'maruyu-webcommons/node/middleware/sessionData';
 * app.use(sessionDataMiddleware()); // デフォルト: /api/session/data
 * app.use(sessionDataMiddleware('/custom/session')); // カスタム: /custom/session/data
 */
export function sessionDataMiddleware(basePath: string): express.Router {
  const router = express.Router();
  
  // GET: セッションデータの取得
  router.get(`${basePath}/data`, [
    requireQueryZod(z.object({
      key: z.string(),
    }))
  ], asyncHandler(async function(request:express.Request, response:express.Response){
    const { key } = response.locals.query as { key: string };
    if(!key) return sendData(response, { data: null });
    const data = request.session.clientData?.[key] ?? null;
    return sendData(response, { data });
  }));
  
  // PATCH: セッションデータの更新
  router.patch(`${basePath}/data`, [
    requireBodyZod(z.object({
      key: z.string(),
      data: z.any(),
    }))
  ], asyncHandler(async function(request:express.Request, response:express.Response){
    const { key, data } = response.locals.body;
    // clientDataオブジェクトが存在しない場合は初期化
    if(!request.session.clientData) request.session.clientData = {};
    request.session.clientData[key] = data;
    await saveSession(request);    
    return sendNoContent(response);
  }));
  
  // DELETE: セッションデータの削除
  router.delete(`${basePath}/data`, [
    requireQueryZod(z.object({
      key: z.string(),
    }))
  ], asyncHandler(async (request:express.Request, response:express.Response) => {
    const { key } = response.locals.query as { key: string };
    if (request.session.clientData && key in request.session.clientData){
      delete request.session.clientData[key];
      await saveSession(request)
    }
    return sendNoContent(response);
  }));
  return router;
}