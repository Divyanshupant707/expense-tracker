import { useState } from 'react';
import { CATEGORIES, formatCurrency } from '../api';
import styles from './BudgetSettings.module.css';

export default function BudgetSettings({ budgets, onSave }) {
  const budgetMap = Object.fromEntries((budgets || []).map(b => [b.category, b.amount]));
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);

  function startEdit(cat) {
    setEditing(e => ({ ...e, [cat]: String(budgetMap[cat] || '') }));
  }

  async function save(cat) {
    const val = parseFloat(editing[cat]);
    if (!val || val <= 0) return;
    setSaving(cat);
    try {
      await onSave(cat, val);
      setEditing(e => { const n = {...e}; delete n[cat]; return n; });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.desc}>Set monthly budget limits per category</p>
      {CATEGORIES.map(cat => (
        <div key={cat} className={styles.row}>
          <span className={styles.catName}>{cat}</span>
          {editing[cat] !== undefined ? (
            <div className={styles.editRow}>
              <span className={styles.prefix}>₹</span>
              <input
                type="number"
                min="1"
                step="100"
                value={editing[cat]}
                onChange={e => setEditing(ed => ({ ...ed, [cat]: e.target.value }))}
                className={styles.input}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && save(cat)}
              />
              <button
                className={styles.saveBtn}
                onClick={() => save(cat)}
                disabled={saving === cat}
              >
                {saving === cat ? '…' : 'Save'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditing(e => { const n = {...e}; delete n[cat]; return n; })}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className={styles.viewRow}>
              <span className={styles.amount}>
                {budgetMap[cat] ? formatCurrency(budgetMap[cat]) : <span className={styles.none}>Not set</span>}
              </span>
              <button className={styles.editBtn} onClick={() => startEdit(cat)}>
                {budgetMap[cat] ? 'Edit' : 'Set'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
