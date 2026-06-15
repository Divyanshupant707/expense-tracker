# Spendly – Mini Expense Tracker

A full-stack expense tracker that lets you log daily spending, filter by category and date, visualise where your money goes, and set per-category budgets.

**Exercise:** Exercise 2 – Mini Expense Tracker

---

## Live Demo

> Deploy instructions below. Set `REACT_APP_API_URL` to your deployed backend URL before building the frontend.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + CSS Modules | Component-driven, scoped styles, no extra build config |
| Charts | Recharts | Declarative, React-native, great defaults |
| Backend | Node.js + Express 4 | Minimal, well-known, fast to iterate |
| Database | sql.js (SQLite in WASM) | Zero-dependency SQLite; file persists to `server/expenses.db` |
| Testing | Jest + Supertest | Standard Node testing stack |

---

## How to Run Locally

> Assumes only Node.js is installed.

```bash
# 1. Clone and install
git clone <your-repo>
cd expense-tracker

# 2. Install server deps
cd server && npm install

# 3. Run server (port 3001)
npm start
# or for auto-reload: npm run dev

# 4. In another terminal — install and run client (port 3000)
cd ../client && npm install && npm start
```

Open [http://localhost:3000](http://localhost:3000). The React dev server proxies `/api/*` to `http://localhost:3001`.

### Run tests

```bash
cd server && npm test
```

---

## API Documentation

Base URL: `http://localhost:3001/api`

### GET /expenses

Returns expenses, sorted by date descending.

| Query param | Type | Description |
|---|---|---|
| `category` | string | Filter by category name |
| `startDate` | string (YYYY-MM-DD) | Filter from date |
| `endDate` | string (YYYY-MM-DD) | Filter to date |

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "amount": 250.50,
    "category": "Food",
    "date": "2026-06-10",
    "note": "Lunch",
    "created_at": "2026-06-10T12:00:00"
  }
]
```

---

### POST /expenses

Create a new expense.

**Body**
```json
{
  "amount": 250.50,
  "category": "Food",
  "date": "2026-06-10",
  "note": "Lunch"
}
```

**Response** `201 Created` — the created expense object.

**Errors**
- `400` — negative/zero amount, missing category, future date

---

### PUT /expenses/:id

Update an existing expense. All fields optional (partial update).

**Body** (all optional)
```json
{
  "amount": 300,
  "category": "Food",
  "date": "2026-06-10",
  "note": "Updated note"
}
```

**Response** `200 OK` — the updated expense object.

---

### DELETE /expenses/:id

Delete an expense.

**Response** `200 OK`
```json
{ "message": "Deleted successfully" }
```

**Errors** — `404` if not found.

---

### GET /summary

Returns aggregated data for the current month.

**Response** `200 OK`
```json
{
  "totalThisMonth": 4200.00,
  "totalByCategory": [
    { "category": "Food", "total": 1500 },
    { "category": "Bills", "total": 2700 }
  ],
  "highestExpense": { "id": 3, "amount": 2700, "category": "Bills", "date": "2026-06-01", "note": "Rent" },
  "monthlyTrend": [
    { "month": "2026-05", "total": 3800 },
    { "month": "2026-06", "total": 4200 }
  ]
}
```

---

### GET /budgets

Returns all budget settings.

**Response** `200 OK`
```json
[{ "id": 1, "category": "Food", "amount": 5000 }]
```

---

### PUT /budgets/:category

Set or update a budget for a category.

**Body**
```json
{ "amount": 5000 }
```

**Response** `200 OK` — the budget object.

---

## Project Structure

```
expense-tracker/
├── server/
│   ├── index.js          # Express app, all route handlers
│   ├── db.js             # sql.js database abstraction layer
│   ├── index.test.js     # Jest + Supertest API tests (11 tests)
│   ├── package.json
│   └── expenses.db       # SQLite file (created on first run)
│
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── api.js                        # Fetch wrapper, helpers, CSV export
│       ├── App.jsx                       # Root layout, state, data fetching
│       ├── App.module.css
│       ├── index.css                     # Global design tokens + resets
│       ├── index.js
│       └── components/
│           ├── ExpenseForm.jsx           # Add/edit form with validation
│           ├── ExpenseForm.module.css
│           ├── ExpenseList.jsx           # Filterable table with edit/delete
│           ├── ExpenseList.module.css
│           ├── SummaryPanel.jsx          # Monthly totals + budget bars
│           ├── SummaryPanel.module.css
│           ├── Charts.jsx                # Pie (by category) + Bar (trend)
│           ├── Charts.module.css
│           ├── BudgetSettings.jsx        # Per-category budget editor
│           └── BudgetSettings.module.css
│
└── package.json                          # Root scripts
```

---

## Next Steps

**What I chose not to do (and why):**

- **Authentication** — brief specified "assume one user", so skipped to keep scope tight.
- **React Query / SWR** — opted for plain `useCallback` + `useState` to keep deps minimal and reviewable.
- **Recurring expenses** — useful but out of scope for the brief.

**What I'd build next:**

1. **User auth** (JWT + bcrypt) so multiple users can share one deployment
2. **Recurring expense templates** — weekly groceries, monthly rent set-and-forget
3. **Push/email alerts** when a budget is about to be exceeded
4. **Richer date grouping** — weekly view, year-over-year comparison
5. **PWA support** — offline-first with service worker + background sync
6. **Multi-currency** — conversion via open exchange rates API

---

## Notes

- Used Recharts for charts (React-native, good accessibility defaults)
- Currency formatted with `Intl.NumberFormat` using the browser locale (defaults to INR ₹)
- sql.js chosen over better-sqlite3 for zero native dependency build step — important for Render/Railway free tier deployment where node-gyp builds can fail
- All backend validation mirrors frontend validation (defense in depth)
