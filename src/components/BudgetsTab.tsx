import React from 'react';
import { Target, TrendingUp, DollarSign } from 'lucide-react';
import { Transaction } from '../types';

interface BudgetsTabProps {
  expenseCategories: string[];
  categoriesMap: Record<string, string[]>;
  monthlyTransactions: Transaction[];
  totalExpensePlanned: number;
  totalExpenseExecuted: number;
  totalExpenseRemaining: number;
  globalExpensePercentage: number;
  getCategoryBudget: (category: string) => number;
  onUpdateCategoryBudget: (category: string, value: string) => Promise<void>;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  expenseCategories,
  categoriesMap,
  monthlyTransactions,
  totalExpensePlanned,
  totalExpenseExecuted,
  totalExpenseRemaining,
  globalExpensePercentage,
  getCategoryBudget,
  onUpdateCategoryBudget
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Orçamento Planejado</p>
          <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">
            R$ {totalExpensePlanned.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Meta total definida para o mês</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Executado</p>
          <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
            R$ {totalExpenseExecuted.toFixed(2)}
          </h3>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${
                globalExpensePercentage > 100 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(globalExpensePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{globalExpensePercentage.toFixed(1)}% executado</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase">Saldo Disponível no Orçamento</p>
          <h3
            className={`text-3xl font-extrabold mt-1 ${
              totalExpenseRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            R$ {totalExpenseRemaining.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {totalExpenseRemaining >= 0 ? 'Dentro do limite previsto' : 'Atenção: limite ultrapassado'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map(cat => {
          const planned = getCategoryBudget(cat);
          const executed = monthlyTransactions
            .filter(t => t.origem === cat)
            .reduce((sum, t) => sum + (Number(t.saída) || 0), 0);
          const progress = planned > 0 ? Math.min((executed / planned) * 100, 100) : 0;
          const isOver = executed > planned && planned > 0;

          return (
            <div
              key={cat}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-base">{cat}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(categoriesMap[cat] || []).slice(0, 3).join(', ')}...
                  </p>
                </div>
                <div className="text-right">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Meta (R$)</label>
                  <input
                    type="number"
                    step="10"
                    className="w-28 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-right font-bold text-indigo-300 focus:border-indigo-500 focus:outline-none transition-colors"
                    value={planned}
                    onChange={e => onUpdateCategoryBudget(cat, e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">
                    Gasto: <strong className="text-slate-200">R$ {executed.toFixed(2)}</strong>
                  </span>
                  <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {planned > 0 ? `${((executed / planned) * 100).toFixed(0)}%` : 'Sem Meta'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${planned > 0 ? Math.min((executed / planned) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
