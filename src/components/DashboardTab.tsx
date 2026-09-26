import React, { useEffect, useRef } from 'react';
import {
  Activity, ShieldCheck, TrendingUp, TrendingDown, DollarSign,
  PieChart, Zap, BarChart3
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { Transaction } from '../types';
import { MONTHS } from '../constants';

Chart.register(...registerables);

interface DashboardTabProps {
  monthlyTransactions: Transaction[];
  transactions: Transaction[];
  expenseCategories: string[];
  selectedMonth: number;
  selectedYear: number;
  selectedPeriodKey: string;
  monthlyIncome: number;
  monthlyExpensesTotal: number;
  incomeExpenseRatio: number;
  financialHealthScore: number;
  historicalComparison: { period: string; income: number; expense: number }[];
  theme?: 'light' | 'dark';
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  monthlyTransactions,
  expenseCategories,
  selectedMonth,
  selectedYear,
  selectedPeriodKey,
  monthlyIncome,
  monthlyExpensesTotal,
  incomeExpenseRatio,
  financialHealthScore,
  historicalComparison,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  const trendChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
    const tickColor = isLight ? '#475569' : '#94a3b8';
    const legendColor = isLight ? '#1e293b' : '#cbd5e1';
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      const catTotals: Record<string, number> = {};
      expenseCategories.forEach(cat => {
        const sum = monthlyTransactions
          .filter(t => t.origem === cat)
          .reduce((acc, t) => acc + (Number(t.saída) || 0), 0);
        if (sum > 0) catTotals[cat] = sum;
      });

      const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
      const labels = sortedCats.map(item => item[0]);
      const dataValues = sortedCats.map(item => item[1]);

      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        categoryChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length > 0 ? labels : ['Sem dados'],
            datasets: [{
              label: 'Gastos por Categoria (R$)',
              data: dataValues.length > 0 ? dataValues : [0],
              backgroundColor: 'rgba(99, 102, 241, 0.75)',
              borderColor: 'rgba(99, 102, 241, 1)',
              borderWidth: 1,
              borderRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { grid: { color: gridColor }, ticks: { color: tickColor } },
              x: { grid: { display: false }, ticks: { color: tickColor } }
            }
          }
        });
      }
    }

    if (trendChartRef.current) {
      if (trendChartInstance.current) {
        trendChartInstance.current.destroy();
      }

      const recentHist = [...historicalComparison].reverse().slice(-6);
      const trendLabels = recentHist.map(h => h.period);
      const trendIncome = recentHist.map(h => h.income);
      const trendExpense = recentHist.map(h => h.expense);

      const ctx2 = trendChartRef.current.getContext('2d');
      if (ctx2) {
        trendChartInstance.current = new Chart(ctx2, {
          type: 'line',
          data: {
            labels: trendLabels.length > 0 ? trendLabels : [selectedPeriodKey],
            datasets: [
              {
                label: 'Receitas (R$)',
                data: trendIncome.length > 0 ? trendIncome : [0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Despesas (R$)',
                data: trendExpense.length > 0 ? trendExpense : [0],
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                fill: true,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: legendColor } }
            },
            scales: {
              y: { grid: { color: gridColor }, ticks: { color: tickColor } },
              x: { grid: { display: false }, ticks: { color: tickColor } }
            }
          }
        });
      }
    }

    return () => {
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
      if (trendChartInstance.current) trendChartInstance.current.destroy();
    };
  }, [monthlyTransactions, historicalComparison, selectedPeriodKey, expenseCategories, theme, isLight]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-slate-900 border border-indigo-500/30 p-5 rounded-2xl shadow-xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
            Dashboard Analítico e Inteligência Financeira
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada, proporção de despesas e projeções para {MONTHS[selectedMonth - 1]} / {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-indigo-500/20">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Score de Saúde</span>
            <span className="text-lg font-black text-emerald-400">{financialHealthScore} / 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-semibold uppercase">Receitas do Mês</p>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">
            R$ {monthlyIncome.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total de entradas registradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-semibold uppercase">Despesas do Mês</p>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-rose-400 mt-2">
            R$ {monthlyExpensesTotal.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total de saídas registradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-semibold uppercase">Comprometimento da Renda</p>
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className={`text-3xl font-extrabold mt-2 ${incomeExpenseRatio > 100 ? 'text-rose-400' : 'text-indigo-300'}`}>
              {incomeExpenseRatio.toFixed(1)}%
            </h3>
          </div>
          <div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-500 ${
                  incomeExpenseRatio > 100 ? 'bg-rose-500' : incomeExpenseRatio > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(incomeExpenseRatio, 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {incomeExpenseRatio > 100 ? 'Alerta: Gastos superiores às receitas' : 'Gastos dentro da proporção de receita'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            Distribuição de Gastos por Categoria
          </h3>
          <div className="relative h-72 w-full flex-1">
            <canvas ref={categoryChartRef}></canvas>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Tendência Histórica (Receitas x Despesas)
          </h3>
          <div className="relative h-72 w-full flex-1">
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Comparativo Histórico entre Meses
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Período (Ano-Mês)</th>
                <th className="p-3 text-right">Receitas (R$)</th>
                <th className="p-3 text-right">Despesas (R$)</th>
                <th className="p-3 text-right">Saldo Líquido (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historicalComparison.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">Nenhum dado histórico encontrado.</td>
                </tr>
              ) : (
                historicalComparison.map(item => {
                  const net = item.income - item.expense;
                  return (
                    <tr key={item.period} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-300">{item.period}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">+ R$ {item.income.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-rose-400">- R$ {item.expense.toFixed(2)}</td>
                      <td className={`p-3 text-right font-mono font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {net >= 0 ? `+ R$ ${net.toFixed(2)}` : `- R$ ${Math.abs(net).toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
