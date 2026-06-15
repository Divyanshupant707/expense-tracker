import { useState, useEffect } from 'react';
import { CATEGORIES } from '../api';
import styles from './ExpenseForm.module.css';

const today = new Date().toISOString().split('T')[0];

const EMPTY = { amount: '', category: '', date: today, note: '' };

export default function ExpenseForm({ onSubmit, initialData, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: String(initialData.amount),
        category: initialData.category,
        date: initialData.date,
        note: initialData.note || '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initialData]);

  function validate() {
    const errs = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a positive amount';
    if (!form.category) errs.category = 'Select a category';
    if (!form.date) errs.date = 'Select a date';
    else if (form.date > today) errs.date = 'Date cannot be in the future';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) });
      setForm(EMPTY);
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Amount (₹)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={e => field('amount', e.target.value)}
            className={errors.amount ? styles.invalid : ''}
          />
          {errors.amount && <span className={styles.error}>{errors.amount}</span>}
        </div>

        <div className={styles.field}>
          <label>Category</label>
          <select
            value={form.category}
            onChange={e => field('category', e.target.value)}
            className={errors.category ? styles.invalid : ''}
          >
            <option value="">Select…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <span className={styles.error}>{errors.category}</span>}
        </div>

        <div className={styles.field}>
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            max={today}
            onChange={e => field('date', e.target.value)}
            className={errors.date ? styles.invalid : ''}
          />
          {errors.date && <span className={styles.error}>{errors.date}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label>Note <span className={styles.optional}>(optional)</span></label>
        <input
          type="text"
          placeholder="What was this for?"
          value={form.note}
          maxLength={200}
          onChange={e => field('note', e.target.value)}
        />
      </div>

      {errors.submit && <p className={styles.submitError}>{errors.submit}</p>}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Save Changes' : '+ Add Expense'}
        </button>
      </div>
    </form>
  );
}
