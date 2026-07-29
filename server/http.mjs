// Shared HTTP response helpers for the API routes.
//
// The route modules repeatedly wrap their handlers in try/catch and return the
// same shape (`{ error }` with a status code). Centralizing that keeps the
// status codes and response-body fields identical across endpoints (the frontend
// contract in frontend/src/types/api.ts) while removing the duplication.

// Send a JSON error response. Keeps every route's `{ error }` body field and
// status code consistent. Returns the response so callers can `return sendError(...)`.
export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Wrap an async/sync handler so thrown errors become a 500 `{ error }` instead
// of an unhandled rejection. Pass an optional status (default 500). The
// underlying handler may still short-circuit with its own res.status().json().
export function withErrors(handler, { status = 500 } = {}) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      // If headers are already sent (e.g. an SSE stream), we cannot synthesize
      // a JSON error; let Express's default handler deal with it.
      if (res.headersSent) return next(err);
      sendError(res, status, err.message);
    }
  };
}
