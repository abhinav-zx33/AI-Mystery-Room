import express from 'express';
import { casesRouter } from './routes/cases.routes.js';
import { attachRequestId, corsAllowlist, requestLogger, securityHeaders } from './middleware/hardening.js';

export const app = express();

app.disable('x-powered-by');
app.use(attachRequestId);
app.use(securityHeaders);
app.use(requestLogger);
app.use(corsAllowlist);
app.use(express.json({ limit: '32kb' }));

app.get('/api/v1/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/v1/cases', casesRouter);

app.use('/api', (request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'This API route is not available yet.',
      requestId: request.id,
    },
  });
});

app.use((failure, request, response, _next) => {
  if (failure.type === 'entity.too.large') {
    return response.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body must be 32 KB or smaller.', requestId: request.id },
    });
  }
  if (failure.type === 'entity.parse.failed') {
    return response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'The request body must contain valid JSON.', requestId: request.id },
    });
  }

  const status = Number.isInteger(failure.status) && failure.status >= 400 && failure.status < 500 ? failure.status : 500;
  console.error(JSON.stringify({ requestId: request.id, category: 'api_request_failed', errorType: failure.name ?? 'Error', status }));
  return response.status(status).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed. Please try again.',
      requestId: request.id,
    },
  });
});
