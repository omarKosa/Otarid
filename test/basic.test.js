const request = require('supertest');
const app = require('../src/server');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
  });
});

// Add more tests for routes as needed
