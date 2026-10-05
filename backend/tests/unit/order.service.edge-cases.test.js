import { describe, it, expect, vi, beforeEach } from 'vitest';
import orderService from '../../src/services/order.service.js';
import database from '../../src/infra/database.js';
import queue from '../../src/infra/queue.js';
import { getMetrics } from '../../src/telemetry/metrics.js';
import { createMockPool, createMockQueue } from '../helpers/mocks.js';

const validItem = { sku: 'SKU-1', name: 'Item', price: 1000, quantity: 1 };
const validPayload = {
  customer_name: 'Test Customer',
  customer_email: 'customer@example.com',
  items: [validItem]
};

describe('Order Service - Edge Cases', () => {
  let mockPool;
  let mockQueue;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPool = createMockPool();
    mockQueue = createMockQueue();
    database.setPool(mockPool);
    queue.setOrderQueue(mockQueue);
  });

  describe('createOrder() input validation', () => {
    it('rejects an item with quantity 0', async () => {
      const payload = { ...validPayload, items: [{ ...validItem, quantity: 0 }] };
      await expect(orderService.createOrder(payload)).rejects.toThrow();
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('rejects an item with a non-integer quantity', async () => {
      const payload = { ...validPayload, items: [{ ...validItem, quantity: 1.5 }] };
      await expect(orderService.createOrder(payload)).rejects.toThrow();
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('rejects a customer name shorter than 2 characters', async () => {
      const payload = { ...validPayload, customer_name: 'A' };
      await expect(orderService.createOrder(payload)).rejects.toThrow();
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('does not enqueue a job when validation fails', async () => {
      const payload = { ...validPayload, customer_email: 'invalid' };
      await expect(orderService.createOrder(payload)).rejects.toThrow();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('listOrders() pagination limits', () => {
    it('caps limit at 100 and falls back to page 1 for invalid page', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await orderService.listOrders({ page: -5, limit: 1000 });

      expect(res.pagination.limit).toBe(100);
      expect(res.pagination.page).toBe(1);
    });

    it('passes the status filter as a query parameter instead of inlining it', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.listOrders({ status: "failed'; DROP TABLE orders;--" });

      const [countSql, countParams] = mockPool.query.mock.calls[0];
      expect(countSql).not.toContain('DROP TABLE');
      expect(countParams).toEqual(["failed'; DROP TABLE orders;--"]);
    });
  });

  describe('updateOrderStatus() audit event', () => {
    it('records a STATUS_FAILED event that carries the failure reason', async () => {
      const orderId = 'a0000000-0000-4000-a000-000000000000';
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: orderId, status: 'failed' }] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.updateOrderStatus(orderId, 'failed', 'Payment declined', {
        step: 'PAYMENT_GATEWAY'
      });

      const [, eventParams] = mockPool.query.mock.calls[1];
      expect(eventParams[0]).toBe(orderId);
      expect(eventParams[1]).toBe('STATUS_FAILED');
      expect(JSON.parse(eventParams[2])).toEqual({
        failureReason: 'Payment declined',
        step: 'PAYMENT_GATEWAY'
      });
    });
  });

  describe('telemetry', () => {
    it('increments the orders_created_total counter after creating an order', async () => {
      const mockOrder = {
        id: '55555555-5555-4555-a555-555555555555',
        customer_email: 'customer@example.com',
        total_amount: 1110,
        status: 'pending'
      };
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.createOrder(validPayload);

      const metrics = await getMetrics();
      expect(metrics).toMatch(/orders_created_total\{status="pending"\} [1-9]/);
    });
  });
});