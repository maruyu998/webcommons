import express from 'express';
import { asyncHandler, sendData } from '../express';

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
export function sessionDataMiddleware(basePath = '/api/session'): express.Router {
  const router = express.Router();
  
  // GET: セッションデータの取得
  router.get(`${basePath}/data`, asyncHandler(async (req, res) => {
    const { key } = req.query as { key?: string };
    
    if (!key) {
      return sendData(res, { data: null });
    }
    
    const data = req.session.clientData?.[key] ?? null;
    return sendData(res, { data });
  }));
  
  // PATCH: セッションデータの更新
  router.patch(`${basePath}/data`, express.json(), asyncHandler(async (req, res) => {
    const { key, data } = req.body;
    
    if (!key) {
      throw new Error('Key is required');
    }
    
    // clientDataオブジェクトが存在しない場合は初期化
    if (!req.session.clientData) {
      req.session.clientData = {};
    }
    
    // データの保存
    req.session.clientData[key] = data;
    
    // セッションの保存を明示的に実行
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return sendData(res, { success: true });
  }));
  
  // DELETE: セッションデータの削除
  router.delete(`${basePath}/data`, asyncHandler(async (req, res) => {
    const { key } = req.query as { key?: string };
    
    if (!key) {
      throw new Error('Key is required');
    }
    
    if (req.session.clientData && key in req.session.clientData) {
      delete req.session.clientData[key];
      
      // セッションの保存を明示的に実行
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    return sendData(res, { success: true });
  }));
  
  return router;
}