const BASE = process.env.REACT_APP_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Expenses
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
    return request(`/expenses${qs.toString() ? '?' + qs : ''}`);
  },
  createExpense: (body) => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (id, body) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Summary
  getSummary: () => request('/summary'),

  // Budgets
  getBudgets: () => request('/budgets'),
  setBudget: (category, amount) =>
    request(`/budgets/${encodeURIComponent(category)}`, { method: 'PUT', body: JSON.stringify({ amount }) }),
};

export const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#6366f1',
  Transport: '#22d3ee',
  Bills: '#f59e0b',
  Entertainment: '#ec4899',
  Other: '#10b981',
};

export function formatCurrency(amount, locale = navigator.language) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function exportToCSV(expenses) {
  const headers = ['ID', 'Date', 'Category', 'Amount', 'Note'];
  const rows = expenses.map((e) => [
    e.id,
    e.date,
    e.category,
    e.amount,
    `"${(e.note || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
