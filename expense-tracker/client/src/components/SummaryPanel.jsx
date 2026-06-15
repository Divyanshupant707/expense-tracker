import { CATEGORY_COLORS, formatCurrency } from '../api';
import styles from './SummaryPanel.module.css';

export default function SummaryPanel({ summary, budgets }) {
  if (!summary) return <div className={styles.loading}>Loading summary…</div>;

  const { totalThisMonth, totalByCategory, highestExpense } = summary;

  const budgetMap = Object.fromEntries((budgets || []).map(b => [b.category, b.amount]));

  return (
    <div className={styles.panel}>
      <div className={styles.stat}>
        <span className={styles.label}>Spent this month</span>
        <span className={styles.big}>{formatCurrency(totalThisMonth)}</span>
      </div>

      {highestExpense && (
        <div className={styles.stat}>
          <span className={styles.label}>Highest expense</span>
          <span className={styles.value}>{formatCurrency(highestExpense.amount)}</span>
          <span className={styles.sub}>{highestExpense.category} · {highestExpense.date}</span>
        </div>
      )}

      <div className={styles.categories}>
        <span className={styles.label}>By category</span>
        {totalByCategory.length === 0 ? (
          <p className={styles.empty}>No expenses this month</p>
        ) : (
          totalByCategory.map(({ category, total }) => {
            const budget = budgetMap[category];
            const pct = budget ? Math.min((total / budget) * 100, 100) : null;
            const over = budget && total > budget;
            return (
              <div key={category} className={styles.catRow}>
                <div className={styles.catInfo}>
                  <span className={styles.dot} style={{ background: CATEGORY_COLORS[category] }} />
                  <span className={styles.catName}>{category}</span>
                  <span className={`${styles.catAmount} ${over ? styles.over : ''}`}>
                    {formatCurrency(total)}
                    {budget && <span className={styles.budget}> / {formatCurrency(budget)}</span>}
                  </span>
                </div>
                {pct !== null && (
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${over ? styles.overBar : ''}`}
                      style={{ width: `${pct}%`, background: over ? 'var(--danger)' : CATEGORY_COLORS[category] }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
