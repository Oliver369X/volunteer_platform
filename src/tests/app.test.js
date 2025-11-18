'use strict';

const request = require('supertest');
const app = require('../app');

describe('Health endpoint', () => {
  it('debería responder con el estado OK', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});


