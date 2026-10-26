import express from 'express';
import { casesRouter } from './routes/cases.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.get('/api/v1/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/v1/cases', casesRouter);

app.use('/api', (_request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'This API route is not available yet.',
    },
  });
});

app.use((error, _request, response, _next) => {
  console.error(`API request failed: ${error.name ?? 'Error'}`);
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The request could not be completed. Please try again.',
    },
  });
});
