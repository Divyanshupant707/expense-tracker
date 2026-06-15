import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { CATEGORY_COLORS, formatCurrency } from '../api';
import styles from './Charts.module.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className={styles.tooltip}>
        <span className={styles.tooltipName}>{payload[0].name}</span>
        <span className={styles.tooltipVal}>{formatCurrency(payload[0].value)}</span>
      </div>
    );
  }
  return null;
};

export default function Charts({ summary }) {
  if (!summary) return null;

  const { totalByCategory, monthlyTrend } = summary;

  const pieData = totalByCategory.map(({ category, total }) => ({
    name: category,
    value: total,
  }));

  const barData = monthlyTrend.map(({ month, total }) => ({
    month: month.slice(5),  // "06" from "2026-06"
    total,
  }));

  if (pieData.length === 0) {
    return (
      <div className={styles.empty}>
        Add expenses to see charts
      </div>
    );
  }

  return (
    <div className={styles.charts}>
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>This Month by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name] || '#888'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.legend}>
          {pieData.map(({ name, value }) => (
            <div key={name} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CATEGORY_COLORS[name] }} />
              <span className={styles.legendName}>{name}</span>
              <span className={styles.legendVal}>{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {barData.length > 1 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Spent']}
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                cursor={{ fill: 'rgba(124,111,247,0.08)' }}
              />
              <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
