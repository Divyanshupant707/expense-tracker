const express = require('express');
const cors = require('cors');
const { getDb, all, get, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB on startup
let dbReady = false;
getDb().then(() => {
  dbReady = true;
  console.log('Database ready');
});

function ensureDb(req, res, next) {
  if (!dbReady) return res.status(503).json({ error: 'Database not ready' });
  next();
}

app.use(ensureDb);

// ─── Expenses ───────────────────────────────────────────────

/**
 * GET /api/expenses
 * Query params: category, startDate, endDate
 * Returns: array of expenses sorted by date desc
 */
app.get('/api/expenses', (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY date DESC, created_at DESC';
    const expenses = all(sql, params);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/expenses
 * Body: { amount: number, category: string, date: string, note?: string }
 * Returns: created expense object
 */
app.post('/api/expenses', (req, res) => {
  try {
    const { amount, category, date, note } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be a positive number' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const today = new Date().toISOString().split('T')[0];
    if (date > today) return res.status(400).json({ error: 'Date cannot be in the future' });

    const result = run(
      'INSERT INTO expenses (amount, category, date, note) VALUES (?, ?, ?, ?)',
      [amount, category, date, note || null]
    );

    const expense = get('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/expenses/:id
 * Body: { amount?: number, category?: string, date?: string, note?: string }
 * Returns: updated expense object
 */
app.put('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, date, note } = req.body;

    const existing = get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const newAmount = amount !== undefined ? amount : existing.amount;
    const newCategory = category || existing.category;
    const newDate = date || existing.date;
    const newNote = note !== undefined ? note : existing.note;

    if (newAmount <= 0) return res.status(400).json({ error: 'Amount must be a positive number' });

    const today = new Date().toISOString().split('T')[0];
    if (newDate > today) return res.status(400).json({ error: 'Date cannot be in the future' });

    run(
      'UPDATE expenses SET amount = ?, category = ?, date = ?, note = ? WHERE id = ?',
      [newAmount, newCategory, newDate, newNote, id]
    );

    const updated = get('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/expenses/:id
 * Returns: { message: "Deleted successfully" }
 */
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    run('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Summary ───────────────────────────────────────────────

/**
 * GET /api/summary
 * Returns: { totalThisMonth, totalByCategory, highestExpense, monthlyTrend }
 */
app.get('/api/summary', (req, res) => {
  try {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalThisMonthRow = get(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%Y-%m', date) = ?",
      [thisMonth]
    );

    const totalByCategory = all(
      "SELECT category, SUM(amount) as total FROM expenses WHERE strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC",
      [thisMonth]
    );

    const highestExpense = get(
      "SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ? ORDER BY amount DESC LIMIT 1",
      [thisMonth]
    );

    // Last 6 months trend
    const monthlyTrend = all(`
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

    res.json({
      totalThisMonth: totalThisMonthRow?.total || 0,
      totalByCategory,
      highestExpense,
      monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Budgets ───────────────────────────────────────────────

/**
 * GET /api/budgets
 * Returns: array of budget objects
 */
app.get('/api/budgets', (req, res) => {
  try {
    const budgets = all('SELECT * FROM budgets');
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/budgets/:category
 * Body: { amount: number }
 * Returns: updated budget object
 */
app.put('/api/budgets/:category', (req, res) => {
  try {
    const { category } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Budget must be positive' });

    run(
      'INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET amount = ?',
      [category, amount, amount]
    );

    const budget = get('SELECT * FROM budgets WHERE category = ?', [category]);
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
