import { useState } from 'react';
import { CATEGORIES, formatCurrency, exportToCSV } from '../api';
import ExpenseForm from './ExpenseForm';
import styles from './ExpenseList.module.css';

const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom', value: 'custom' },
];

function getDateRange(filter) {
  const now = new Date();
  if (filter === 'thisMonth') {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = now.toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }
  if (filter === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { startDate: start, endDate: end };
  }
  return {};
}

export default function ExpenseList({ expenses, onUpdate, onDelete, filterState, onFilterChange }) {
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { category, dateFilter, customStart, customEnd } = filterState;

  const today = new Date().toISOString().split('T')[0];

  function handleDeleteClick(id) {
    setDeleteConfirm(id);
  }

  async function confirmDelete(id) {
    await onDelete(id);
    setDeleteConfirm(null);
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={category}
          onChange={e => onFilterChange({ category: e.target.value })}
          className={styles.select}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className={styles.dateFilters}>
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.chip} ${dateFilter === f.value ? styles.active : ''}`}
              onClick={() => onFilterChange({ dateFilter: f.value })}
            >
              {f.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className={styles.customRange}>
            <input
              type="date"
              value={customStart}
              max={today}
              onChange={e => onFilterChange({ customStart: e.target.value })}
              className={styles.dateInput}
            />
            <span className={styles.rangeSep}>to</span>
            <input
              type="date"
              value={customEnd}
              max={today}
              onChange={e => onFilterChange({ customEnd: e.target.value })}
              className={styles.dateInput}
            />
          </div>
        )}

        <button
          className={styles.exportBtn}
          onClick={() => exportToCSV(expenses)}
          disabled={expenses.length === 0}
        >
          ↓ CSV
        </button>
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p>No expenses found</p>
          <p className={styles.emptyHint}>Add your first expense above</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th className={styles.right}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <>
                  <tr key={exp.id} className={`${styles.row} animate-in`}>
                    <td className={styles.date}>{exp.date}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[exp.category?.toLowerCase()]}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className={styles.note}>{exp.note || <span className={styles.noNote}>—</span>}</td>
                    <td className={`${styles.amount} ${styles.right}`}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => setEditingId(editingId === exp.id ? null : exp.id)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {deleteConfirm === exp.id ? (
                        <span className={styles.confirmRow}>
                          <button className={styles.confirmYes} onClick={() => confirmDelete(exp.id)}>Delete</button>
                          <button className={styles.confirmNo} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteClick(exp.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                  {editingId === exp.id && (
                    <tr key={`edit-${exp.id}`} className={styles.editRow}>
                      <td colSpan={5}>
                        <div className={styles.editForm}>
                          <ExpenseForm
                            initialData={exp}
                            onSubmit={async (data) => {
                              await onUpdate(exp.id, data);
                              setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
