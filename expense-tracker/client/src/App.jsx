import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SummaryPanel from './components/SummaryPanel';
import Charts from './components/Charts';
import BudgetSettings from './components/BudgetSettings';
import './index.css';
import styles from './App.module.css';

const TABS = ['Expenses', 'Charts', 'Budgets'];

const DEFAULT_FILTER = {
  category: 'All',
  dateFilter: 'thisMonth',
  customStart: '',
  customEnd: '',
};

function getDateParams(filterState) {
  const { dateFilter, customStart, customEnd } = filterState;
  const now = new Date();

  if (dateFilter === 'thisMonth') {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = now.toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }
  if (dateFilter === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { startDate: start, endDate: end };
  }
  if (dateFilter === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }
  return {};
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [activeTab, setActiveTab] = useState('Expenses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadExpenses = useCallback(async (f = filter) => {
    try {
      const params = { category: f.category !== 'All' ? f.category : undefined, ...getDateParams(f) };
      const data = await api.getExpenses(params);
      setExpenses(data);
    } catch (e) {
      setError(e.message);
    }
  }, [filter]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    try {
      const data = await api.getBudgets();
      setBudgets(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadExpenses(), loadSummary(), loadBudgets()]).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  function handleFilterChange(patch) {
    const newFilter = { ...filter, ...patch };
    setFilter(newFilter);
    loadExpenses(newFilter);
  }

  async function handleCreate(data) {
    await api.createExpense(data);
    await Promise.all([loadExpenses(), loadSummary()]);
  }

  async function handleUpdate(id, data) {
    await api.updateExpense(id, data);
    await Promise.all([loadExpenses(), loadSummary()]);
  }

  async function handleDelete(id) {
    await api.deleteExpense(id);
    await Promise.all([loadExpenses(), loadSummary()]);
  }

  async function handleBudgetSave(category, amount) {
    await api.setBudget(category, amount);
    await loadBudgets();
  }

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>₹</span>
            <span className={styles.logoName}>Spendly</span>
          </div>
          <p className={styles.tagline}>Track every rupee, stress-free</p>
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error} — is the server running?
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className={styles.layout}>
          {/* Left: Add form + tabs */}
          <div className={styles.left}>
            {/* Add Expense Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Add Expense</h2>
              <ExpenseForm onSubmit={handleCreate} />
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {TABS.map(t => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className={styles.card}>
              {loading ? (
                <div className={styles.loading}>Loading…</div>
              ) : activeTab === 'Expenses' ? (
                <ExpenseList
                  expenses={expenses}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  filterState={filter}
                  onFilterChange={handleFilterChange}
                />
              ) : activeTab === 'Charts' ? (
                <Charts summary={summary} />
              ) : (
                <BudgetSettings budgets={budgets} onSave={handleBudgetSave} />
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <aside className={styles.sidebar}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Summary</h2>
              <SummaryPanel summary={summary} budgets={budgets} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
