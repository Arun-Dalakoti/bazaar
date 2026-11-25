import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ status: 404, message: 'Not found' });
};

// Express recognises error handlers by their four arguments, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  if (status >= 500) {
    req.log?.error({ err }, 'Unhandled error');
  }

  if (res.headersSent) {
    return;
  }

  // Never leak internal error details to clients on 5xx responses.
  res.status(status).json({
    status,
    message: status >= 500 ? 'Internal server error' : String(err.message ?? 'Request failed'),
  });
};
