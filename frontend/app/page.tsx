
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "./api";
import {ArrowDownCircle, ArrowUpCircle, TrendingDown, Activity, TrendingUp, Wallet, Trash, Plus, PlusCircle} from "lucide-react";

type Transaction = {
  id : string;
  text: string
  amount: number;
  created_at: string;
}


export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [text, setText] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState<boolean>(false);

  
  // fetch Transactions
  const getTransactions = async () => {
    try {
      const res = await api.get<Transaction[]>("transactions/");
      setTransactions(res.data);
      toast.success("Transactions fetched successfully")
    } catch (error) {
      console.error("Error fetching transactions", error)
      toast.error("Failed to fetch transactions");
    }
  }

  useEffect(() => {
    getTransactions();
  }, []);


// add Transaction
const addTransaction = async () => {
  if (!text || amount === "" || Number.isNaN(Number(amount))) {
    toast.error("Please provide valid text and amount");
    return;
  }

  setLoading(true);
  try {
    const res = await api.post<Transaction>("transactions/", {
      text,
      amount: Number(amount),
    });
    // prepend new transaction
    setTransactions([res.data, ...transactions]);

    const modal = document.getElementById('my_modal_3') as HTMLDialogElement | null;
    modal?.close();

    toast.success("Transaction added successfully");
    setText("");
    setAmount("");
  } catch (error) {
    console.error("Error adding transaction", error);
    toast.error("Failed to add transaction");
  } finally {
    setLoading(false);
  }
}


// delete Transaction
  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`transactions/${id}/`);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("Transaction deleted successfully")
    } catch (error) {
      console.error("Error deleting transaction", error)
      toast.error("Failed to delete transaction");
    }
  }



  const amountArray = transactions.map((t) =>Number(t.amount) || 0);

  const balance = amountArray.reduce((acc, item) => acc + item, 0) || 0;

  const income = amountArray.filter((a) => a > 0).reduce((acc, item) => acc + item, 0) || 0; 

  const expense = amountArray.filter((a) => a < 0).reduce((acc, item) => acc + item, 0) || 0;

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

  return (
   <div className="w-2/3 flex flex-col gap-4">
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
          {expense.toFixed(2)} U
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
    <button 
    className="btn btn-warning" 
    onClick={()=>(document.getElementById('my_modal_3').showModal() as HTMLDialogElement).showModal()}>
      <PlusCircle className="w-4 h-4"/>
      Add Transaction
    </button>


    <div className="overflow-x-auto rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>

          {transactions.map((t, index) => (
            
          <tr
            key={t.id}
            className={t.amount > 0 ? "bg-success/10" : "bg-error/10"}
          >
            <th>{index + 1}</th>

            <td>{t.text}</td>

            <td className="font-semibold flex items-center gap-2">
              {t.amount > 0 ? (
                <TrendingUp className="text-success w-6 h-6"/>
              ) : (
                <TrendingDown className="text-error w-6 h-6"/>
              )}
              {t.amount > 0 ? `+${t.amount}` : `${t.amount}`}
              {/* {t.amount > 0 ? `+${t.amount}` : `-${Math.abs(t.amount)}`} */}

            </td>

            <td>{formatDate(t.created_at)}</td>

            <td>
              <button 
              className="btn btn-sm btn-error btn-soft" 
              title="Delete item" 
              onClick={() => deleteTransaction(t.id)}>
                <Trash className="w-4 h-6"/>
              </button>
            </td>
          </tr>
          ))}

        </tbody>
      </table>
    </div>

    <dialog id="my_modal_3" className="modal backdrop-blur">
      <div className="modal-box border-2 border-warning/10 border-dashed bg-worning/5">
        <form method="dialog">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 className="font-bold text-lg">Add Transaction</h3>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2 mt-4">
            <label className="label">Description</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add desctiption"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label">Amount(add a (-) for expenses)</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Add amount"
            />
          </div>
          <div className="modal-action">
            <button 
            className="btn btn-warning"
            onClick={addTransaction}
            >
              <Plus className="w-4 h-4"/>
              Add Transaction
            </button>
          </div>
        </div>
      </div>
    </dialog>
   </div>
  );
}
