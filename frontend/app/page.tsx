
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import toast from "react-hot-toast";
import api from "./api";
import { useAuth } from "./contexts/AuthContext";
import {ArrowDownCircle, ArrowUpCircle, TrendingDown, Activity, TrendingUp, Wallet, Trash, Plus, PlusCircle, LogOut, User} from "lucide-react";

type Category = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

type Transaction = {
  id: string;
  text: string;
  amount: number;
  type?: 'income' | 'expense';
  date?: string;
  created_at: string;
  category?: { id: string; name: string; color?: string; icon?: string } | null;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [text, setText] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  
  // Fetch categories (for dropdown and filter)
  const getCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<Category[] | { results?: Category[] }>("categories/");
      const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setCategories(list);
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  }, [isAuthenticated]);

  // Fetch transactions (API returns { results: Transaction[], summary?: {...} }). Optional filter by category.
  const getTransactions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const params = new URLSearchParams();
      if (filterCategoryId) params.set("category", filterCategoryId);
      const url = params.toString() ? `transactions/?${params.toString()}` : "transactions/";
      const res = await api.get<{ results?: Transaction[]; summary?: { balance: number; total_income: number; total_expense: number } }>(url);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setTransactions(list);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown } };
      console.error("Error fetching transactions", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        router.push("/login");
      } else if (err.response?.data) {
        const data = err.response.data as { detail?: string; message?: string };
        const errorMsg = data.detail || data.message || JSON.stringify(err.response.data);
        toast.error(`Failed to fetch transactions: ${errorMsg}`);
      } else {
        toast.error("Failed to fetch transactions. Please check your connection.");
      }
    }
  }, [isAuthenticated, filterCategoryId, logout, router]);

  useEffect(() => {
    if (isAuthenticated) getCategories();
  }, [isAuthenticated, getCategories]);

  useEffect(() => {
    if (isAuthenticated) getTransactions();
  }, [isAuthenticated, getTransactions]);


  // Add transaction (with type and optional category)
  const addTransaction = async () => {
    if (!text || amount === "" || Number.isNaN(Number(amount))) {
      toast.error("Please provide valid description and amount");
      return;
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      const payload: { text: string; amount: number; type: "income" | "expense"; category_id?: string } = {
        text,
        amount: numAmount,
        type: transactionType,
      };
      if (categoryId) payload.category_id = categoryId;

      const res = await api.post<Transaction>("transactions/", payload);
      setTransactions([res.data, ...transactions]);

      const modal = document.getElementById("my_modal_3") as HTMLDialogElement | null;
      if (modal) modal.close();

      toast.success("Transaction added successfully");
      setText("");
      setAmount("");
      setTransactionType("expense");
      setCategoryId("");
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown } };
      console.error("Error adding transaction", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        router.push("/login");
      } else if (err.response?.data) {
        const data = err.response.data as { detail?: string; message?: string };
        const errorMsg = data.detail || data.message || String(err.response.data);
        toast.error(`Failed to add transaction: ${errorMsg}`);
      } else {
        toast.error("Failed to add transaction. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndResetForm = () => {
    setText("");
    setAmount("");
    setTransactionType("expense");
    setCategoryId("");
  };


  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`transactions/${id}/`);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Transaction deleted successfully");
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        router.push("/login");
      } else {
        toast.error("Failed to delete transaction");
      }
    }
  };



  // Backend uses type (income/expense) and positive amounts
  const income = transactions
    .filter((t) => (t.type ?? (Number(t.amount) > 0 ? 'income' : 'expense')) === 'income')
    .reduce((acc, t) => acc + Number(t.amount) || 0, 0);
  const expense = transactions
    .filter((t) => (t.type ?? (Number(t.amount) > 0 ? 'income' : 'expense')) === 'expense')
    .reduce((acc, t) => acc + Number(t.amount) || 0, 0);
  const balance = income - expense;

  const ratio = income > 0 ? Math.min((Math.abs(expense) / income) * 100, 100) : 0;

  const formatDate = (datestring: string) => {
    const d = new Date(datestring);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading or nothing while checking auth
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
   <div className="w-2/3 flex flex-col gap-4">
    {/* Header with user info and logout */}
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="avatar placeholder" aria-label="View profile">
          <div className="bg-warning/20 text-warning rounded-full w-12 h-12 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
        </Link>
        <div>
          <p className="font-semibold">
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user?.username}
          </p>
          <p className="text-sm text-base-content/60">{user?.email}</p>
        </div>
      </div>
      <button 
        className="btn btn-ghost btn-sm"
        onClick={handleLogout}
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
    <div className="flex justify-between rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">

{/* Account balance */}
      <div className="flex flex-col gap-1">
        <div className="badge badge-soft">
          <div><Wallet className="w-4 h4" /></div>
          <div className="font-medium">Current Balance</div>
        </div>
        <div className="stat-value">
          {balance.toFixed(2)} U
        </div>
      </div>

{/* Revenue */}
      <div className="flex flex-col gap-1">
        <div className="badge badge-soft badge-success">
          <div><ArrowUpCircle className="w-4 h4" /></div>
          <div className="font-medium">Revenue</div>
        </div>
        <div className="stat-value">
          {income.toFixed(2)} U
        </div>
      </div>

{/* Expenses */}
      <div className="flex flex-col gap-1 badge-error">
        <div className="badge badge-soft">
          <div><ArrowDownCircle className="w-4 h4" /></div>
          <div className="font-medium">Expenses</div>
        </div>
        <div className="stat-value">
          {(-expense).toFixed(2)} U
        </div>
      </div>

    </div>


    <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">
      <div className="flex justify-between items-center mb-1">
     
        <div className="badge badge-soft badge-warning gap-1">
        <div><Activity className="w-4 h4" /></div>
          Expenses vs Revenue
        </div>
        <div>
          {ratio.toFixed(0)}%
        </div>

      </div>
      <progress
        className="progress progress-worning w-full"
        value={ratio}
        max={100}
      />
    </div>
    {/* You can open the modal using document.getElementById('ID').showModal() method */}
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="btn btn-warning"
        onClick={() => {
          const modal = document.getElementById("my_modal_3") as HTMLDialogElement | null;
          if (modal) modal.showModal();
        }}
      >
        <PlusCircle className="w-4 h-4" />
        Add Transaction
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/70">Filter by category:</span>
        <select
          className="select select-bordered select-sm max-w-xs"
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="overflow-x-auto rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => {
            const isIncome = (t.type ?? (Number(t.amount) > 0 ? "income" : "expense")) === "income";
            const displayAmount = isIncome ? Number(t.amount) : -Number(t.amount);
            return (
              <tr key={t.id} className={isIncome ? "bg-success/10" : "bg-error/10"}>
                <th>{index + 1}</th>
                <td>{t.text}</td>
                <td>
                  {t.category ? (
                    <span
                      className="badge badge-sm border-0"
                      style={{ backgroundColor: t.category.color || "#6b7280", color: "#fff" }}
                    >
                      {t.category.name}
                    </span>
                  ) : (
                    <span className="text-base-content/50 text-sm">—</span>
                  )}
                </td>
                <td className="font-semibold flex items-center gap-2">
                  {isIncome ? (
                    <TrendingUp className="text-success w-6 h-6" />
                  ) : (
                    <TrendingDown className="text-error w-6 h-6" />
                  )}
                  {displayAmount >= 0 ? `+${displayAmount}` : `${displayAmount}`}
                </td>
                <td>{formatDate(t.date ?? t.created_at)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-error btn-soft"
                    title="Delete item"
                    onClick={() => deleteTransaction(t.id)}
                  >
                    <Trash className="w-4 h-6" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <dialog
      id="my_modal_3"
      className="modal backdrop-blur"
      onClose={closeModalAndResetForm}
    >
      <div className="modal-box border-2 border-warning/10 border-dashed bg-warning/5">
        <form method="dialog">
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModalAndResetForm}>
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg">Add Transaction</h3>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="label">Type</label>
            <div className="join w-full">
              <button
                type="button"
                className={`join-item btn flex-1 ${transactionType === "income" ? "btn-success" : "btn-ghost"}`}
                onClick={() => setTransactionType("income")}
              >
                <ArrowUpCircle className="w-4 h-4 mr-1" />
                Income
              </button>
              <button
                type="button"
                className={`join-item btn flex-1 ${transactionType === "expense" ? "btn-error" : "btn-ghost"}`}
                onClick={() => setTransactionType("expense")}
              >
                <ArrowDownCircle className="w-4 h-4 mr-1" />
                Expense
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label">Description</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Groceries, Salary"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label">Category (optional)</label>
            <select
              className="select select-bordered w-full"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label">Amount (positive number)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-warning" onClick={addTransaction} disabled={loading}>
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" className="w-full h-full min-w-full min-h-full opacity-0 cursor-default" onClick={closeModalAndResetForm} aria-label="Close">close</button>
      </form>
    </dialog>
   </div>
  );
}
