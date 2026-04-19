jest.mock('../src/utils/authClient', () => ({
  syncUserToAuth: jest.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const Profile = require('../src/models/Profile');
const app = require('../src/server');

describe('Profile routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    userId = uuidv4();
    await Profile.create({
      userId,
      name: 'Test User',
      email: 'testuser_profile@example.com',
      bio: '',
    });
    token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await Profile.destroy({ where: { userId }, force: true });
  });

  it('GET /api/profile should return profile', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Test User');
  });

  it('PATCH /api/profile should update bio', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Updated bio' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.bio).toBe('Updated bio');
  });
});
