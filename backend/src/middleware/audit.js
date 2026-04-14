import { query } from '../config/db.js';

export function auditLog(action, resource = null, resourceId = null) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const userId = req.user ? req.user.id : null;
      const ip = req.ip || req.connection?.remoteAddress;
      const userAgent = req.get('User-Agent') || null;
      query(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, request_method, request_path, status_code, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          action,
          resource,
          resourceId ? String(resourceId) : null,
          ip,
          userAgent,
          req.method,
          req.originalUrl,
          res.statusCode,
          JSON.stringify({ body: res.statusCode < 400 ? 'success' : body }),
        ]
      ).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}
