"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Calendar,
  PieChart,
  BarChart3,
  Lightbulb,
  User,
  Edit3,
  Home,
  Receipt,
} from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title
);

type AnalyticsSummary = {
  period: { start_date: string; end_date: string };
  summary: {
    total_income: number;
    total_expense: number;
    balance: number;
    transaction_count: number;
    income_count: number;
    expense_count: number;
  };
  expenses_by_category: { category_name: string; color: string; total: number; count: number }[];
  income_by_category: { category_name: string; color: string; total: number; count: number }[];
  by_month: { month: string; income: number; expense: number }[];
};

const PERIODS = [
  { label: "This month", getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start_date: start.toISOString().slice(0, 10), end_date: now.toISOString().slice(0, 10) };
  }},
  { label: "Last 3 months", getRange: () => {
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - 3);
    return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
  }},
  { label: "This year", getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return { start_date: start.toISOString().slice(0, 10), end_date: now.toISOString().slice(0, 10) };
  }},
  { label: "Last 12 months", getRange: () => {
    const end = new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
  }},
];

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingAnalytics(true);
    setError(null);
    try {
      const { start_date, end_date } = PERIODS[periodIndex].getRange();
      const res = await api.get<AnalyticsSummary>("analytics/summary/", {
        params: { start_date, end_date },
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics fetch error", err);
      setError("Could not load analytics. Please try again.");
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [isAuthenticated, periodIndex]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAnalytics();
  }, [isAuthenticated, fetchAnalytics]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-warning" />
      </div>
    );
  }

  const summary = analytics?.summary;
  const hasData = summary && (summary.transaction_count > 0);
  const expenseRatio = summary && summary.total_income > 0
    ? Math.min(100, (summary.total_expense / summary.total_income) * 100)
    : 0;
  const savingsRatio = summary && summary.total_income > 0
    ? Math.max(0, ((summary.total_income - summary.total_expense) / summary.total_income) * 100)
    : 0;

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-");
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const recommendations: string[] = [];
  if (summary) {
    if (summary.transaction_count === 0) {
      recommendations.push("Add income and expense transactions to see your analytics and recommendations here.");
    } else {
      if (summary.total_income > 0) {
        if (savingsRatio >= 20) {
          recommendations.push(`Great jobm you're saving about ${savingsRatio.toFixed(0)}% of your income.`);
        } else if (savingsRatio > 0) {
          recommendations.push(`You're saving ${savingsRatio.toFixed(0)}% of income. Consider aiming for at least 20% savings.`);
        } else {
          recommendations.push("Expenses exceed income this period. Review spending or look for ways to increase income.");
        }
      }
      if (expenseRatio > 80 && summary.total_income > 0) {
        recommendations.push("Over 80% of income goes to expenses. Look for categories where you can cut back.");
      }
      if (analytics?.expenses_by_category?.length) {
        const top = analytics.expenses_by_category[0];
        const pct = summary.total_expense > 0 ? ((top.total / summary.total_expense) * 100).toFixed(0) : "0";
        recommendations.push(`Top spending: ${top.category_name} (${pct}% of expenses). Consider setting a budget for it.`);
      }
      if (analytics?.income_by_category?.length && summary.total_income > 0) {
        const top = analytics.income_by_category[0];
        const pct = ((top.total / summary.total_income) * 100).toFixed(0);
        recommendations.push(`Main income source: ${top.category_name} (${pct}% of income).`);
      }
    }
  }

  const doughnutExpenseData = analytics?.expenses_by_category?.length
    ? {
        labels: analytics.expenses_by_category.map((c) => c.category_name),
        datasets: [
          {
            data: analytics.expenses_by_category.map((c) => c.total),
            backgroundColor: analytics.expenses_by_category.map((c) => c.color),
            borderWidth: 2,
            borderColor: "hsl(var(--b1))",
          },
        ],
      }
    : null;

  const barData = analytics?.by_month?.length
    ? {
        labels: analytics.by_month.map((m) => formatMonth(m.month)),
        datasets: [
          {
            label: "Income",
            data: analytics.by_month.map((m) => m.income),
            backgroundColor: "rgba(34, 197, 94, 0.7)",
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 1,
          },
          {
            label: "Expense",
            data: analytics.by_month.map((m) => m.expense),
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "rgb(239, 68, 68)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 pb-8">
      {/* Header: User card + period + actions */}
      <div className="card bg-base-200/50 border border-base-300 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="bg-warning/20 text-warning rounded-full w-16 h-16 flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user?.first_name || user?.last_name
                    ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
                    : user?.username}
                </h1>
                <p className="text-sm text-base-content/60">{user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/profile/edit" className="btn btn-warning btn-sm gap-1">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link href="/" className="btn btn-ghost btn-sm gap-1">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-warning" />
        <span className="font-medium">Period:</span>
        <div className="join">
          {PERIODS.map((_, i) => (
            <button
              key={i}
              className={`join-item btn btn-sm ${i === periodIndex ? "btn-warning" : "btn-ghost"}`}
              onClick={() => setPeriodIndex(i)}
            >
              {PERIODS[i].label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fetchAnalytics()}>
            Retry
          </button>
        </div>
      )}

      {loadingAnalytics ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-warning" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat bg-base-200/50 rounded-xl border border-base-300 shadow">
              <div className="stat-figure text-warning">
                <Wallet className="w-8 h-8" />
              </div>
              <div className="stat-title">Balance</div>
              <div className={`stat-value text-lg ${(summary?.balance ?? 0) >= 0 ? "text-success" : "text-error"}`}>
                {(summary?.balance ?? 0).toFixed(2)}
              </div>
              <div className="stat-desc">Income − Expenses</div>
            </div>
            <div className="stat bg-base-200/50 rounded-xl border border-base-300 shadow">
              <div className="stat-figure text-success">
                <ArrowUpCircle className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Income</div>
              <div className="stat-value text-lg text-success">{(summary?.total_income ?? 0).toFixed(2)}</div>
              <div className="stat-desc">{summary?.income_count ?? 0} transactions</div>
            </div>
            <div className="stat bg-base-200/50 rounded-xl border border-base-300 shadow">
              <div className="stat-figure text-error">
                <ArrowDownCircle className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Expenses</div>
              <div className="stat-value text-lg text-error">{(summary?.total_expense ?? 0).toFixed(2)}</div>
              <div className="stat-desc">{summary?.expense_count ?? 0} transactions</div>
            </div>
            <div className="stat bg-base-200/50 rounded-xl border border-base-300 shadow">
              <div className="stat-figure text-info">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="stat-title">Transactions</div>
              <div className="stat-value text-lg">{(summary?.transaction_count ?? 0)}</div>
              <div className="stat-desc">In selected period</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card bg-base-200/50 border border-base-300 shadow-xl">
              <div className="card-body">
                <h3 className="card-title gap-2">
                  <PieChart className="w-5 h-5 text-warning" />
                  Expenses by category
                </h3>
                <div className="h-64">
                  {doughnutExpenseData ? (
                    <Doughnut data={doughnutExpenseData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-base-content/50">
                      No expense data in this period
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card bg-base-200/50 border border-base-300 shadow-xl">
              <div className="card-body">
                <h3 className="card-title gap-2">
                  <BarChart3 className="w-5 h-5 text-warning" />
                  Income vs expense by month
                </h3>
                <div className="h-64">
                  {barData ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-base-content/50">
                      No monthly data in this period
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expense ratio bar */}
          {hasData && summary && summary.total_income > 0 && (
            <div className="card bg-base-200/50 border border-base-300 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title gap-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  Expenses vs income
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <progress
                      className="progress progress-warning w-full"
                      value={expenseRatio}
                      max={100}
                    />
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-success">Income 100%</span>
                      <span className="text-error">Expenses {expenseRatio.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="badge badge-success badge-lg">
                    Save {savingsRatio.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card bg-base-200/50 border border-base-300 shadow-xl">
            <div className="card-body">
              <h3 className="card-title gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Recommendations
              </h3>
              {recommendations.length ? (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-warning mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base-content/60">Add transactions to get personalized recommendations.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
