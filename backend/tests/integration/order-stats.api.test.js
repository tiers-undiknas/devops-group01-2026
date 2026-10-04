import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../../src/app.js';
import database from '../../src/infra/database.js';
import queue from '../../src/infra/queue.js';
import { createMockPool, createMockQueue } from '../helpers/mocks.js';

describe('GET /api/v1/orders/stats (Integration)', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPool = createMockPool();
    database.setPool(mockPool);
    queue.setOrderQueue(createMockQueue());
    app = createApp();
  });

  it('returns the total and the count per status', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { status: 'confirmed', count: '7' },
        { status: 'pending', count: '2' },
        { status: 'failed', count: '1' }
      ]
    });

    const res = await request(app).get('/api/v1/orders/stats');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 10,
      byStatus: { confirmed: 7, pending: 2, failed: 1 }
    });
  });

  it('returns zero totals when there are no orders', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/v1/orders/stats');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 0, byStatus: {} });
  });
});