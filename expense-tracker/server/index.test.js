const request = require('supertest');
const app = require('./index');

// Wait for DB to be ready
beforeAll(() => new Promise(resolve => setTimeout(resolve, 1500)));

describe('Expenses API', () => {
  let createdId;

  test('POST /api/expenses - creates an expense', async () => {
    const res = await request(app).post('/api/expenses').send({
      amount: 250.50,
      category: 'Food',
      date: '2026-01-15',
      note: 'Lunch',
    });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(250.50);
    expect(res.body.category).toBe('Food');
    createdId = res.body.id;
  });

  test('POST /api/expenses - rejects negative amount', async () => {
    const res = await request(app).post('/api/expenses').send({
      amount: -100,
      category: 'Food',
      date: '2026-01-15',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/expenses - rejects future date', async () => {
    const res = await request(app).post('/api/expenses').send({
      amount: 100,
      category: 'Food',
      date: '2099-01-01',
    });
    expect(res.status).toBe(400);
  });

  test('GET /api/expenses - returns array', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/expenses - filters by category', async () => {
    const res = await request(app).get('/api/expenses?category=Food');
    expect(res.status).toBe(200);
    res.body.forEach(e => expect(e.category).toBe('Food'));
  });

  test('PUT /api/expenses/:id - updates an expense', async () => {
    const res = await request(app).put(`/api/expenses/${createdId}`).send({ amount: 300 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(300);
  });

  test('DELETE /api/expenses/:id - deletes an expense', async () => {
    const res = await request(app).delete(`/api/expenses/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Deleted successfully');
  });

  test('DELETE /api/expenses/:id - 404 for non-existent', async () => {
    const res = await request(app).delete('/api/expenses/99999');
    expect(res.status).toBe(404);
  });
});

describe('Summary API', () => {
  test('GET /api/summary - returns summary shape', async () => {
    const res = await request(app).get('/api/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalThisMonth');
    expect(res.body).toHaveProperty('totalByCategory');
    expect(res.body).toHaveProperty('highestExpense');
    expect(res.body).toHaveProperty('monthlyTrend');
  });
});

describe('Budgets API', () => {
  test('PUT /api/budgets/:category - sets budget', async () => {
    const res = await request(app).put('/api/budgets/Food').send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(5000);
  });

  test('GET /api/budgets - returns budgets', async () => {
    const res = await request(app).get('/api/budgets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
