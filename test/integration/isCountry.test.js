const request = require('supertest');
const app = require('../../server');

describe('isCountry API', () => {
  test('should return true for valid country', async () => {
    const response = await request(app)
      .post('/api/isCountry')
      .send({ inputString: 'United States' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: true });
  });

  test('should return false for invalid country', async () => {
    const response = await request(app)
      .post('/api/isCountry')
      .send({ inputString: 'InvalidCountry' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: false });
  });

  test('should return 400 for missing input string', async () => {
    const response = await request(app)
      .post('/api/isCountry')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Input string required as a parameter.' });
  });
});