const request = require('supertest');
const app = require('../src/server');

describe('Profile Routes', () => {
  let token;

  beforeAll(async () => {
    // Register and login a user to get a token
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'TestPass1' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@example.com', password: 'TestPass1' });
    token = res.body.accessToken;
  });

  it('GET /api/v1/profile should return user profile', async () => {
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });

  it('PATCH /api/v1/profile should update profile', async () => {
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated User', bio: 'Updated bio' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Updated User');
    expect(res.body.user.bio).toBe('Updated bio');
  });

  it('PATCH /api/v1/profile/change-password should change password', async () => {
    const res = await request(app)
      .patch('/api/v1/profile/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPass1', newPassword: 'NewTestPass1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/v1/profile/delete-account should delete account', async () => {
    const res = await request(app)
      .delete('/api/v1/profile/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewTestPass1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
