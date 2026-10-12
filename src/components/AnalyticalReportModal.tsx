import React, { useRef, useState, useMemo } from 'react';
import {
  Printer, Download, X, FileText, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, DollarSign, PieChart, ShieldCheck,
  Calendar, User, CreditCard, ChevronRight, Sparkles, Target,
  Layers, ArrowUpRight, ArrowDownRight, Clock, HelpCircle, Loader2,
  Award, BarChart3, Zap, Check, Wallet, Percent, ShieldAlert
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import * as htmlToImage from 'html-to-image';
import { Transaction, Card, FixedAccount } from '../types';
import { MONTHS } from '../constants';

interface AnalyticalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  fixedAccounts?: FixedAccount[];
  budgets?: Record<string, number>;
  cards?: Card[];
  talysonBalance?: number;
  karlaBalance?: number;
  consolidatedBalance?: number;
  theme?: 'light' | 'dark';
}

// Paleta de cores vibrante e consistente para categorias financeiras
const CATEGORY_THEMES: Record<string, { hex: string; bg: string; text: string; border: string }> = {
  'Infraestrutura': { hex: '#4f46e5', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'Dia a Dia': { hex: '#d97706', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'Transporte': { hex: '#0891b2', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  'Lazer': { hex: '#9333ea', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'Cuidados Pessoais': { hex: '#db2777', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  'Vestuário': { hex: '#e11d48', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  'Educação': { hex: '#059669', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Crianças': { hex: '#0d9488', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  'Presentes': { hex: '#ea580c', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'Comunicação': { hex: '#2563eb', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Alimentação': { hex: '#b45309', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  'Mercado': { hex: '#15803d', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Saúde': { hex: '#be123c', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  'Outros': { hex: '#475569', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' }
};

const DEFAULT_PALETTE = [
  '#4f46e5', '#d97706', '#0891b2', '#9333ea', '#db2777',
  '#059669', '#e11d48', '#2563eb', '#ea580c', '#0d9488', '#64748b'
];

export const AnalyticalReportModal: React.FC<AnalyticalReportModalProps> = ({
  isOpen,
  onClose,
  monthlyTransactions,
  transactions,
  expenseCategories,
  selectedMonth,
  selectedYear,
  selectedPeriodKey,
  monthlyIncome,
  monthlyExpensesTotal,
  incomeExpenseRatio,
  financialHealthScore,
  historicalComparison,
  fixedAccounts = [],
  budgets = {},
  cards = [],
  talysonBalance = 0,
  karlaBalance = 0,
  consolidatedBalance = 0,
  theme = 'dark'
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('Gerando PDF...');
  const [generatedBlobUrl, setGeneratedBlobUrl] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Cálculo de dados para a análise
  const monthName = MONTHS[selectedMonth - 1] || `Mês ${selectedMonth}`;
  const netSavings = monthlyIncome - monthlyExpensesTotal;
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
  const issueDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Gastos por Categoria
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      const cat = t.origem || 'Outros';
      const val = Number(t.saída) || 0;
      if (val > 0) {
        map[cat] = (map[cat] || 0) + val;
      }
    });

    const entries = Object.entries(map).map(([categoria, total], idx) => {
      const budgetKey = `${selectedPeriodKey}_${categoria}`;
      const orcamento = budgets[budgetKey] !== undefined ? budgets[budgetKey] : (budgets[categoria] || 0);
      const percentualDoTotal = monthlyExpensesTotal > 0 ? (total / monthlyExpensesTotal) * 100 : 0;
      const desvio = orcamento > 0 ? total - orcamento : 0;
      const themeColor = CATEGORY_THEMES[categoria] || {
        hex: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300'
      };

      return {
        categoria,
        total,
        percentualDoTotal,
        orcamento,
        desvio,
        excedido: orcamento > 0 && total > orcamento,
        themeColor
      };
    });

    return entries.sort((a, b) => b.total - a.total);
  }, [monthlyTransactions, budgets, selectedPeriodKey, monthlyExpensesTotal]);

  // Gastos por Indivíduo (Talyson vs Karla vs Ambos)
  const individualStats = useMemo(() => {
    let talysonTotal = 0;
    let karlaTotal = 0;
    let outrosTotal = 0;

    monthlyTransactions.forEach(t => {
      const saida = Number(t.saída) || 0;
      if (saida > 0) {
        if (t.individuo === 'Talyson') talysonTotal += saida;
        else if (t.individuo === 'Karla') karlaTotal += saida;
        else outrosTotal += saida;
      }
    });

    return {
      talyson: talysonTotal,
      talysonPct: monthlyExpensesTotal > 0 ? (talysonTotal / monthlyExpensesTotal) * 100 : 0,
      karla: karlaTotal,
      karlaPct: monthlyExpensesTotal > 0 ? (karlaTotal / monthlyExpensesTotal) * 100 : 0,
      outros: outrosTotal,
      outrosPct: monthlyExpensesTotal > 0 ? (outrosTotal / monthlyExpensesTotal) * 100 : 0,
    };
  }, [monthlyTransactions, monthlyExpensesTotal]);

  // Divisão por Operação (Crédito vs Débito/Pix)
  const operationStats = useMemo(() => {
    let credito = 0;
    let debitoPix = 0;
    monthlyTransactions.forEach(t => {
      const saida = Number(t.saída) || 0;
      if (saida > 0) {
        if (t.operacao === 'Crédito') credito += saida;
        else debitoPix += saida;
      }
    });
    return {
      credito,
      creditoPct: monthlyExpensesTotal > 0 ? (credito / monthlyExpensesTotal) * 100 : 0,
      debitoPix,
      debitoPixPct: monthlyExpensesTotal > 0 ? (debitoPix / monthlyExpensesTotal) * 100 : 0,
    };
  }, [monthlyTransactions, monthlyExpensesTotal]);

  // Maiores Gastos do Mês (Top 5)
  const topExpenses = useMemo(() => {
    return [...monthlyTransactions]
      .filter(t => (Number(t.saída) || 0) > 0)
      .sort((a, b) => (Number(b.saída) || 0) - (Number(a.saída) || 0))
      .slice(0, 5);
  }, [monthlyTransactions]);

  // Formatação segura de datas para exibição em tabelas
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Constantes de paginação para o PDF (para caber perfeitamente no formato A4 sem cortar informações)
  const FIRST_PAGE_MOVEMENT_SIZE = 15;
  const SUBSEQUENT_PAGE_MOVEMENT_SIZE = 20;

  // Todas as Movimentações do Mês (ordenadas cronologicamente do PRIMEIRO ao ÚLTIMO lançamento)
  const allMonthlyMovements = useMemo(() => {
    return [...monthlyTransactions].sort((a, b) => {
      const strA = a.data || '';
      const strB = b.data || '';
      if (strA && strB && strA !== strB) {
        return strA.localeCompare(strB);
      }
      const timeA = a.data ? new Date(a.data).getTime() : 0;
      const timeB = b.data ? new Date(b.data).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || 0) - (b.id || 0);
    });
  }, [monthlyTransactions]);

  // Paginação inteligente dos lançamentos para o PDF (distribuição equilibrada para o formato A4)
  // Página 1 dos lançamentos tem cabeçalho, KPIs e títulos (~15 linhas por página).
  // Páginas subsequentes têm apenas mini cabeçalho e tabela contínua (~20 linhas por página).
  const movementPages = useMemo(() => {
    if (allMonthlyMovements.length === 0) return [[]];
    const pages: (typeof allMonthlyMovements)[] = [];

    let cursor = 0;
    // Primeira página de movimentações
    pages.push(allMonthlyMovements.slice(cursor, cursor + FIRST_PAGE_MOVEMENT_SIZE));
    cursor += FIRST_PAGE_MOVEMENT_SIZE;

    // Páginas subsequentes se necessário
    while (cursor < allMonthlyMovements.length) {
      pages.push(allMonthlyMovements.slice(cursor, cursor + SUBSEQUENT_PAGE_MOVEMENT_SIZE));
      cursor += SUBSEQUENT_PAGE_MOVEMENT_SIZE;
    }

    return pages;
  }, [allMonthlyMovements]);

  // Total de páginas do relatório completo (3 páginas analíticas fixas + total de páginas de lançamentos)
  const totalReportPages = useMemo(() => {
    return 3 + Math.max(1, movementPages.length);
  }, [movementPages]);

  // Situação de Contas Fixas
  const fixedStats = useMemo(() => {
    const listForPeriod: { name: string; value: number; status: string; dueDate: string }[] = [];
    let totalFixas = 0;
    let totalPago = 0;
    let totalPendente = 0;

    fixedAccounts.forEach(fa => {
      if (!fa.ativo) return;
      const inst = fa.installments?.find(i => i.periodo === selectedPeriodKey);
      if (inst) {
        const val = Number(inst.valor) || fa.valorPadrao || 0;
        totalFixas += val;
        if (inst.status === 'pago') totalPago += val;
        else totalPendente += val;

        listForPeriod.push({
          name: fa.nome,
          value: val,
          status: inst.status,
          dueDate: inst.dataVencimento
        });
      }
    });

    return {
      totalFixas,
      totalPago,
      totalPendente,
      count: listForPeriod.length,
      list: listForPeriod
    };
  }, [fixedAccounts, selectedPeriodKey]);

  // Classificação da Regra 50/30/20 aproximada
  const rule503020 = useMemo(() => {
    const essencialCats = ['Infraestrutura', 'Dia a Dia', 'Transporte', 'Cuidados Pessoais', 'Educação', 'Crianças', 'Alimentação', 'Mercado', 'Saúde'];
    const desejosCats = ['Lazer', 'Vestuário', 'Presentes', 'Comunicação'];

    let essencialVal = 0;
    let desejosVal = 0;

    categoryStats.forEach(c => {
      if (essencialCats.includes(c.categoria)) {
        essencialVal += c.total;
      } else if (desejosCats.includes(c.categoria)) {
        desejosVal += c.total;
      } else {
        essencialVal += c.total * 0.6;
        desejosVal += c.total * 0.4;
      }
    });

    const incomeBase = monthlyIncome > 0 ? monthlyIncome : monthlyExpensesTotal;
    const essencialPct = incomeBase > 0 ? (essencialVal / incomeBase) * 100 : 0;
    const desejosPct = incomeBase > 0 ? (desejosVal / incomeBase) * 100 : 0;
    const poupancaPct = savingsRate > 0 ? savingsRate : 0;

    return {
      essencialVal,
      essencialPct,
      desejosVal,
      desejosPct,
      poupancaVal: Math.max(0, netSavings),
      poupancaPct
    };
  }, [categoryStats, monthlyIncome, monthlyExpensesTotal, savingsRate, netSavings]);

  // Recomendações e Orientações para Próximos Meses
  const recommendations = useMemo(() => {
    const tips: { title: string; desc: string; type: 'success' | 'warning' | 'alert' | 'info'; action: string }[] = [];
    const topCat = categoryStats[0];

    // 1. Diagnóstico do Resultado
    if (netSavings >= 0) {
      tips.push({
        title: 'Superávit Líquido & Capacidade de Aporte',
        desc: `Parabéns! Você fechou o período no verde com saldo positivo de R$ ${netSavings.toFixed(2)} (${savingsRate.toFixed(1)}% das receitas). O recomendado para o próximo mês é blindar esse excedente antes de planejar novos gastos supérfluos.`,
        action: `Destinar no mínimo R$ ${(netSavings * 0.5).toFixed(2)} (50% do saldo) imediatamente para a Reserva de Emergência ou CDB com liquidez diária.`,
        type: 'success'
      });
    } else {
      tips.push({
        title: 'Déficit Orçamentário - Ajuste Imediato de Rota',
        desc: `As saídas superaram os recebimentos em R$ ${Math.abs(netSavings).toFixed(2)} neste mês. Um déficit continuado corrói o patrimônio e eleva o endividamento futuro.`,
        action: `Suspender compras não-essenciais parceladas no cartão pelos próximos 30 dias até normalizar a margem líquida.`,
        type: 'alert'
      });
    }

    // 2. Análise da Categoria Líder
    if (topCat) {
      const topPct = topCat.percentualDoTotal;
      if (topPct > 35) {
        tips.push({
          title: `Concentração Crítica na Categoria "${topCat.categoria}"`,
          desc: `A categoria "${topCat.categoria}" absorveu ${topPct.toFixed(1)}% (R$ ${topCat.total.toFixed(2)}) de todas as despesas do mês. Esta concentração limita a flexibilidade financeira familiar.`,
          action: `Definir um teto mensal estrito de R$ ${(topCat.total * 0.85).toFixed(2)} para o próximo mês (meta de 15% de economia direta).`,
          type: 'warning'
        });
      } else {
        tips.push({
          title: `Diversificação Equilibrada dos Gastos`,
          desc: `Sua maior linha de desembolso é "${topCat.categoria}" com R$ ${topCat.total.toFixed(2)} (${topPct.toFixed(1)}%). O perfil de gastos demonstra boa distribuição setorial.`,
          action: `Manter o monitoramento semanal e aplicar tetos nas 3 primeiras categorias da tabela.`,
          type: 'info'
        });
      }
    }

    // 3. Comprometimento com Cartão de Crédito
    if (operationStats.creditoPct > 45) {
      tips.push({
        title: 'Exposição Elevada a Faturas de Cartão de Crédito',
        desc: `As compras no cartão representaram ${operationStats.creditoPct.toFixed(1)}% de todas as despesas (R$ ${operationStats.credito.toFixed(2)}). Esse volume compromete a renda dos meses subsequentes antes mesmo do dinheiro entrar.`,
        action: `Migrar pequenos gastos diários prioritariamente para Pix ou Débito, reservando o cartão unicamente para emergências ou compras planejadas.`,
        type: 'warning'
      });
    }

    // 4. Regra dos 50/30/20
    if (rule503020.essencialPct > 60) {
      tips.push({
        title: 'Custos Fixos e Essenciais Acima do Teto Ideal (50%)',
        desc: `Seus gastos com necessidades básicas somaram ${rule503020.essencialPct.toFixed(1)}% do orçamento familiar, pressionando a margem para lazer e poupança.`,
        action: `Auditar contas recorrentes (planos de internet, energia elétrica, streaming) para negociar pacotes mais econômicos no próximo ciclo.`,
        type: 'info'
      });
    }

    // 5. Planejamento das Contas Fixas
    if (fixedStats.totalFixas > 0) {
      tips.push({
        title: 'Provisão Antecipada de Contas Fixas',
        desc: `Você possui R$ ${fixedStats.totalFixas.toFixed(2)} em compromissos fixos cadastrados neste período.`,
        action: `Separar a quantia necessária para pagamento dessas contas logo no primeiro dia útil em que os salários forem creditados.`,
        type: 'info'
      });
    }

    return tips;
  }, [netSavings, savingsRate, categoryStats, operationStats, rule503020, fixedStats]);

  // Cálculos matemáticos dos arcos SVG do Gráfico de Rosca (Donut Chart)
  const donutData = useMemo(() => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius; // ~282.743
    let currentOffset = 0;

    const segments = categoryStats.slice(0, 7).map((cat) => {
      const pct = monthlyExpensesTotal > 0 ? cat.total / monthlyExpensesTotal : 0;
      const strokeLength = Math.max(1, pct * circumference);
      const strokeGap = circumference - strokeLength;
      const offset = -currentOffset;
      currentOffset += strokeLength;

      return {
        ...cat,
        strokeLength,
        strokeGap,
        offset,
        color: cat.themeColor?.hex || '#6366f1'
      };
    });

    return { radius, circumference, segments };
  }, [categoryStats, monthlyExpensesTotal]);

  // Cálculos matemáticos para o Gráfico de Colunas SVG (Receitas vs Despesas vs Saldo)
  const barChartData = useMemo(() => {
    const maxVal = Math.max(monthlyIncome, monthlyExpensesTotal, Math.abs(netSavings), 100);
    const chartHeight = 90;

    const incomeHeight = Math.max(6, (monthlyIncome / maxVal) * chartHeight);
    const expenseHeight = Math.max(6, (monthlyExpensesTotal / maxVal) * chartHeight);
    const savingsHeight = Math.max(6, (Math.max(0, netSavings) / maxVal) * chartHeight);

    return {
      maxVal,
      incomeHeight,
      expenseHeight,
      savingsHeight
    };
  }, [monthlyIncome, monthlyExpensesTotal, netSavings]);

  // Cor do Score de Saúde
  const scoreColor = financialHealthScore >= 80 ? '#10b981' : financialHealthScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = financialHealthScore >= 80 ? 'Excelente' : financialHealthScore >= 60 ? 'Equilibrado' : 'Atenção';
  const scoreBadgeBg = financialHealthScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : financialHealthScore >= 60 ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-rose-500/20 text-rose-300 border-rose-400/30';

  // Helper para acionar download de Blob de forma segura no navegador
  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    setGeneratedBlobUrl(url);
    setGeneratedFileName(filename);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);
  };

  // Função para Impressão Nítida
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Erro ao disparar window.print:', e);
    }
  };

  // =========================================================================
  // GERAÇÃO DO PDF EXECUTIVO FIEL - CAPTURA PÁGINA POR PÁGINA COM ALTA DEFINIÇÃO
  // Garante que o arquivo PDF contenha EXATAMENTE os gráficos, tabelas e cores da tela!
  // =========================================================================
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    setGenerationStepText('Preparando documento executivo...');
    const fileName = `Relatorio_Analitico_Financeiro_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.pdf`;

    try {
      const pageElements = document.querySelectorAll('.report-page');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const renderElementToCanvas = async (el: HTMLElement): Promise<HTMLCanvasElement> => {
        try {
          return await html2canvas(el, {
            scale: 2, // Resolução Retina 2x para máxima nitidez de fontes, gráficos e tabelas
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 0,
            scrollX: 0,
            scrollY: 0
          });
        } catch (h2cError) {
          console.warn('html2canvas falhou, tentando fallback com htmlToImage:', h2cError);
          return await htmlToImage.toCanvas(el, {
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
        }
      };

      if (pageElements && pageElements.length > 0) {
        // Captura cada página individualmente para evitar quebras no meio de textos ou tabelas!
        for (let i = 0; i < pageElements.length; i++) {
          setGenerationStepText(`Renderizando Página ${i + 1} de ${pageElements.length}...`);
          const pageEl = pageElements[i] as HTMLElement;

          const canvas = await renderElementToCanvas(pageEl);
          const imgData = canvas.toDataURL('image/jpeg', 0.96);

          if (i > 0) {
            pdf.addPage('a4', 'p');
          }

          const pageImgHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pageImgHeight), undefined, 'FAST');
        }
      } else {
        // Fallback: captura do container geral
        const element = reportRef.current;
        if (!element) throw new Error('Elemento não encontrado');

        setGenerationStepText('Renderizando documento...');
        const canvas = await renderElementToCanvas(element);

        const pageCanvasHeight = Math.floor(canvas.width * (pdfHeight / pdfWidth));
        const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

        for (let p = 0; p < totalPages; p++) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageCanvasHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            const srcY = p * pageCanvasHeight;
            const srcH = Math.min(pageCanvasHeight, canvas.height - srcY);
            ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          }
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          if (p > 0) pdf.addPage('a4', 'p');
          pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
      }

      setGenerationStepText('Finalizando arquivo PDF...');
      const pdfBlob = pdf.output('blob');
      triggerBlobDownload(pdfBlob, fileName);
    } catch (err) {
      console.error('Erro na renderização do PDF:', err);
      setPdfError(err instanceof Error ? err.message : 'Falha ao processar arquivo PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col my-auto max-h-[96vh] overflow-hidden text-slate-100">
        
        {/* =========================================================
            BARRA DE AÇÕES SUPERIOR DO MODAL
            ========================================================= */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Relatório Analítico & Projeção Financeira
                <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  {monthName} / {selectedYear}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gráficos em cores vivas, tabelas detalhadas e diretrizes estratégicas para os próximos meses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Baixar PDF Principal (Captura Fiel de Gráficos e Tabelas) */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
              title="Baixar arquivo PDF idêntico ao modelo visual da tela com gráficos e tabelas"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {generationStepText}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Baixar PDF (.pdf)
                </>
              )}
            </button>

            {/* Botão Imprimir / Salvar como PDF */}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Salvar como PDF pelo navegador ou Imprimir (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Imprimir
            </button>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Fechar visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALERTA DE SUCESSO DO DOWNLOAD COM BOTÃO MANUAL DIRETO */}
        {generatedBlobUrl && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-emerald-200 gap-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Arquivo PDF gerado com sucesso!</strong> Caso o download automático tenha sido bloqueado pelo navegador, clique no botão ao lado:
              </span>
            </div>
            <a
              href={generatedBlobUrl}
              download={generatedFileName || 'Relatorio_Analitico_Financeiro.pdf'}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Salvar Arquivo PDF Agora
            </a>
          </div>
        )}

        {/* ALERTA CASO OCORRA ERRO NA RENDERIZAÇÃO */}
        {pdfError && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-rose-200 gap-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> Ocorreu uma instabilidade na renderização ({pdfError}). Você pode clicar em <strong>Imprimir</strong> acima para salvar em PDF pelo seu navegador.
              </span>
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Salvar via Janela de Impressão
            </button>
          </div>
        )}

        {/* Dica amigável de formato */}
        <div className="bg-slate-900 border-b border-indigo-500/20 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-indigo-200 gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Fidelidade Visual 100%:</strong> O arquivo PDF é exportado em formato executivo A4 em alta definição com todas as cores, gráficos de rosca, barras comparativas e tabelas estruturadas idênticas à visualização abaixo.
            </span>
          </div>
        </div>

        {/* =========================================================
            ÁREA DE VISUALIZAÇÃO DO DOCUMENTO (SCROLLÁVEL)
            Estruturada em páginas executivas A4 para preservação total
            ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 space-y-8">
          <div
            id="analytical-report-printable-area"
            ref={reportRef}
            className="max-w-[850px] mx-auto space-y-8 font-sans"
          >

            {/* =================================================================
                PÁGINA 1: SÍNTESE EXECUTIVA, KPIS & GRÁFICOS VISUAIS
                ================================================================= */}
            <div className="report-page bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200">
              
              {/* CABEÇALHO EXECUTIVO PREMIUM (BANNER EM CINZA EXECUTIVO & GAUGE) */}
              <div className="bg-slate-800 text-white rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden border border-slate-700">
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                  <div className="space-y-2 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-700/80 text-slate-100 border border-slate-600 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Auditoria & Gestão Financeira Familiar
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      RELATÓRIO ANALÍTICO FINANCEIRO
                    </h1>
                    
                    <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                      Diagnóstico Executivo de Fluxo de Caixa, Distribuição de Gastos e Diretrizes Estratégicas
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white">
                      <span className="flex items-center gap-1.5 font-bold bg-slate-700/70 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-100 shadow-sm">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        Titulares: <strong className="text-white ml-0.5">Talyson & Karla</strong>
                      </span>
                      <span className="flex items-center gap-1.5 font-bold bg-slate-700/70 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-100 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Emissão: <strong className="text-white ml-0.5">{issueDate}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 font-bold bg-slate-700/70 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-100 shadow-sm">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        Lançamentos: <strong className="text-white ml-0.5">{monthlyTransactions.length}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Bloco Lateral: Período & Gauge de Saúde Financeira */}
                  <div className="flex flex-col sm:items-end items-start gap-3 bg-slate-900/80 border border-slate-700 p-4 rounded-xl shadow-md">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Período de Referência
                      </span>
                      <span className="text-xl font-black text-white">
                        {monthName} <span className="text-slate-300 font-medium">/ {selectedYear}</span>
                      </span>
                    </div>

                    {/* Medidor Circular (Gauge) SVG nativo */}
                    <div className="flex items-center gap-3 pt-1">
                      <svg className="w-16 h-16" viewBox="0 0 72 72">
                        <g transform="rotate(-90 36 36)">
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="36"
                            cy="36"
                            r="30"
                            stroke={scoreColor}
                            strokeWidth="6"
                            strokeDasharray={`${(financialHealthScore / 100) * 188.5} 188.5`}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </g>
                      </svg>

                      <div className="text-left">
                        <div className="text-lg font-black text-white leading-none">
                          {financialHealthScore}<span className="text-xs font-semibold text-slate-300">/100</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                          Saúde Financeira
                        </div>
                        <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${scoreBadgeBg}`}>
                          {scoreLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: SÍNTESE DO FLUXO DE CAIXA (4 KPIS COM CORES VIVAS) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    1. Indicadores Chave de Fluxo de Caixa (Mês Vigente)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Valores liquidados no período
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Card 1: Receitas Totais */}
                  <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-teal-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-left shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        Receitas Totais
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-emerald-900 mt-2">
                      R$ {monthlyIncome.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Entradas consolidadas
                    </div>
                  </div>

                  {/* Card 2: Despesas Totais */}
                  <div className="bg-gradient-to-br from-rose-50 via-rose-100/40 to-red-50 border-2 border-rose-300 rounded-2xl p-3.5 text-left shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                        Despesas Totais
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-rose-200/80 flex items-center justify-center text-rose-800">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-rose-900 mt-2">
                      R$ {monthlyExpensesTotal.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 mt-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Saídas registradas
                    </div>
                  </div>

                  {/* Card 3: Saldo Líquido */}
                  <div className={`bg-gradient-to-br rounded-2xl p-3.5 text-left shadow-sm border-2 ${
                    netSavings >= 0
                      ? 'from-indigo-50 via-indigo-100/40 to-blue-50 border-indigo-300'
                      : 'from-amber-50 via-amber-100/40 to-orange-50 border-amber-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        netSavings >= 0 ? 'text-indigo-800' : 'text-amber-800'
                      }`}>
                        Saldo Líquido
                      </span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        netSavings >= 0 ? 'bg-indigo-200/80 text-indigo-800' : 'bg-amber-200/80 text-amber-800'
                      }`}>
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className={`text-xl font-black mt-2 ${
                      netSavings >= 0 ? 'text-indigo-900' : 'text-amber-900'
                    }`}>
                      {netSavings >= 0 ? `+ R$ ${netSavings.toFixed(2)}` : `- R$ ${Math.abs(netSavings).toFixed(2)}`}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 mt-1">
                      {netSavings >= 0 ? (
                        <span className="text-emerald-700">Taxa de Poupança: {savingsRate.toFixed(1)}%</span>
                      ) : (
                        <span className="text-amber-700">Déficit no fechamento</span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Comprometimento */}
                  <div className="bg-gradient-to-br from-slate-50 via-slate-100/60 to-indigo-50/30 border-2 border-slate-300 rounded-2xl p-3.5 text-left shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                        Comprometimento
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className={`text-xl font-black mt-2 ${
                      incomeExpenseRatio > 100 ? 'text-rose-700' : incomeExpenseRatio > 80 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {incomeExpenseRatio.toFixed(1)}%
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 mt-1">
                      {incomeExpenseRatio <= 70 ? 'Faixa Ideal & Saudável' : incomeExpenseRatio <= 90 ? 'Atenção Orçamentária' : 'Limite Ultrapassado'}
                    </div>
                  </div>
                </div>

                {/* Barra / Termômetro Visual de Fluxo de Caixa */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-600" />
                      Termômetro de Absorção de Renda
                    </span>
                    <span className="font-mono text-slate-700">
                      Despesas: <strong className="text-rose-600">{incomeExpenseRatio.toFixed(1)}%</strong> da receita
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className={`h-full transition-all ${
                        incomeExpenseRatio > 100
                          ? 'bg-rose-600'
                          : incomeExpenseRatio > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(incomeExpenseRatio, 100)}%` }}
                    />
                    {incomeExpenseRatio < 100 && (
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${Math.max(0, 100 - incomeExpenseRatio)}%` }}
                        title="Margem Livre de Poupança"
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mt-1">
                    <span className="text-rose-700 font-bold">Saídas: R$ {monthlyExpensesTotal.toFixed(2)}</span>
                    <span className="text-indigo-700 font-bold">Margem Disponível: R$ {Math.max(0, netSavings).toFixed(2)} ({Math.max(0, 100 - incomeExpenseRatio).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: GRÁFICOS ANALÍTICOS DE DISTRIBUIÇÃO (LADO A LADO) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    2. Gráficos Analíticos de Distribuição e Comparação
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Visualização vetorial precisa
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GRÁFICO 1: Rosca / Donut Chart SVG das Categorias */}
                  <div className="bg-slate-50 border-2 border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-indigo-600" />
                        Composição por Categorias
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                        Gráfico de Rosca
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                      {/* SVG Donut */}
                      <div className="relative w-36 h-36 shrink-0">
                        <svg className="w-36 h-36" viewBox="0 0 120 120">
                          <g transform="rotate(-90 60 60)">
                            <circle
                              cx="60"
                              cy="60"
                              r={donutData.radius}
                              stroke="#e2e8f0"
                              strokeWidth="16"
                              fill="transparent"
                            />
                            {donutData.segments.map((seg) => (
                              <circle
                                key={seg.categoria}
                                cx="60"
                                cy="60"
                                r={donutData.radius}
                                stroke={seg.color}
                                strokeWidth="16"
                                strokeDasharray={`${seg.strokeLength} ${seg.strokeGap}`}
                                strokeDashoffset={seg.offset}
                                fill="transparent"
                              />
                            ))}
                          </g>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Total</span>
                          <span className="text-xs font-black text-slate-900 leading-tight">
                            R$ {monthlyExpensesTotal >= 1000 ? `${(monthlyExpensesTotal / 1000).toFixed(1)}k` : monthlyExpensesTotal.toFixed(0)}
                          </span>
                          <span className="text-[9px] font-semibold text-indigo-600 leading-tight">Auditado</span>
                        </div>
                      </div>

                      {/* Legenda Colorida Lateral */}
                      <div className="flex-1 w-full space-y-1.5">
                        {categoryStats.slice(0, 5).map((cat) => (
                          <div key={cat.categoria} className="flex items-center justify-between text-xs bg-white p-1.5 px-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.themeColor?.hex || '#6366f1' }}
                              />
                              <span className="font-semibold text-slate-800 truncate text-[11px]">{cat.categoria}</span>
                            </div>
                            <div className="font-mono text-right shrink-0 text-[11px]">
                              <strong className="text-slate-900">R$ {cat.total.toFixed(0)}</strong>
                              <span className="text-slate-500 ml-1 text-[10px]">({cat.percentualDoTotal.toFixed(1)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GRÁFICO 2: Colunas Comparativas SVG */}
                  <div className="bg-slate-50 border-2 border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        Balanço Comparativo de Colunas
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Entradas vs Saídas
                      </span>
                    </div>

                    <div className="w-full h-44 flex items-end justify-center pt-2">
                      <svg className="w-full h-full" viewBox="0 0 280 140">
                        <line x1="20" y1="20" x2="260" y2="20" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="20" y1="60" x2="260" y2="60" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="20" y1="100" x2="260" y2="100" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="20" y1="110" x2="260" y2="110" stroke="#94a3b8" strokeWidth="1.5" />

                        {/* Barra 1: Receitas (Verde) */}
                        <rect
                          x="45"
                          y={110 - barChartData.incomeHeight}
                          width="45"
                          height={barChartData.incomeHeight}
                          rx="4"
                          fill="#10b981"
                          stroke="#059669"
                          strokeWidth="1"
                        />
                        <text x="67.5" y={105 - barChartData.incomeHeight} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#047857">
                          R${monthlyIncome >= 1000 ? `${(monthlyIncome / 1000).toFixed(1)}k` : monthlyIncome.toFixed(0)}
                        </text>
                        <text x="67.5" y="124" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                          Receitas
                        </text>

                        {/* Barra 2: Despesas (Vermelho) */}
                        <rect
                          x="117.5"
                          y={110 - barChartData.expenseHeight}
                          width="45"
                          height={barChartData.expenseHeight}
                          rx="4"
                          fill="#f43f5e"
                          stroke="#e11d48"
                          strokeWidth="1"
                        />
                        <text x="140" y={105 - barChartData.expenseHeight} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#be123c">
                          R${monthlyExpensesTotal >= 1000 ? `${(monthlyExpensesTotal / 1000).toFixed(1)}k` : monthlyExpensesTotal.toFixed(0)}
                        </text>
                        <text x="140" y="124" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                          Despesas
                        </text>

                        {/* Barra 3: Saldo Líquido (Índigo ou Âmbar) */}
                        <rect
                          x="190"
                          y={110 - barChartData.savingsHeight}
                          width="45"
                          height={barChartData.savingsHeight}
                          rx="4"
                          fill={netSavings >= 0 ? '#6366f1' : '#f59e0b'}
                          stroke={netSavings >= 0 ? '#4f46e5' : '#d97706'}
                          strokeWidth="1"
                        />
                        <text x="212.5" y={105 - barChartData.savingsHeight} textAnchor="middle" fontSize="9" fontWeight="bold" fill={netSavings >= 0 ? '#4338ca' : '#b45309'}>
                          {netSavings >= 0 ? `+R$${(netSavings / 1000).toFixed(1)}k` : `-R$${(Math.abs(netSavings) / 1000).toFixed(1)}k`}
                        </text>
                        <text x="212.5" y="124" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">
                          Saldo
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé da Página 1 */}
              <div className="border-t border-slate-200 mt-6 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <span>Relatório Analítico & Projeção Financeira &bull; {monthName} / {selectedYear}</span>
                <span className="font-semibold text-slate-600">Página 1 de {totalReportPages}</span>
              </div>
            </div>


            {/* =================================================================
                PÁGINA 2: DIAGNÓSTICO ESTRUTURAL 50/30/20 & TABELA DE CATEGORIAS
                ================================================================= */}
            <div className="report-page bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200">
              
              {/* Mini Header da Página 2 */}
              <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-indigo-200 pb-2.5 mb-6">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  RELATÓRIO ANALÍTICO FINANCEIRO &bull; {monthName} / {selectedYear}
                </span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Página 2 de {totalReportPages}
                </span>
              </div>

              {/* SEÇÃO 3: DIAGNÓSTICO ESTRUTURAL (METODOLOGIA 50/30/20) */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    3. Diagnóstico Estrutural de Alocação (Regra 50 / 30 / 20)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Comparativo entre Comportamento Real e Meta Saudável
                  </span>
                </div>

                {/* Barra Empilhada Dupla (Real vs Recomendado) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 space-y-3 shadow-sm">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                      <span>Distribuição Real Observada:</span>
                      <span className="font-mono text-slate-600">
                        {rule503020.essencialPct.toFixed(0)}% Essenciais &bull; {rule503020.desejosPct.toFixed(0)}% Estilo de Vida &bull; {rule503020.poupancaPct.toFixed(0)}% Reserva
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${Math.min(rule503020.essencialPct, 100)}%` }}
                        title="Necessidades Básicas"
                      />
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${Math.min(rule503020.desejosPct, 100 - rule503020.essencialPct)}%` }}
                        title="Desejos & Lazer"
                      />
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.max(0, 100 - rule503020.essencialPct - rule503020.desejosPct)}%` }}
                        title="Poupança & Investimentos"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                      <span>Meta Teórica de Referência:</span>
                      <span className="font-mono text-slate-600">50% Essenciais &bull; 30% Estilo de Vida &bull; 20% Poupança</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex opacity-75">
                      <div className="h-full bg-indigo-400" style={{ width: '50%' }} />
                      <div className="h-full bg-purple-400" style={{ width: '30%' }} />
                      <div className="h-full bg-emerald-400" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>

                {/* 3 Cards dos Blocos 50/30/20 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 50% Essenciais */}
                  <div className="border-2 border-indigo-200 rounded-xl p-3.5 bg-gradient-to-br from-indigo-50/60 to-slate-50 text-left shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-indigo-900">1. Necessidades Básicas</span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-800 font-black px-2 py-0.5 rounded-full">Meta: 50%</span>
                    </div>
                    <div className="text-xl font-black text-indigo-950 mt-1.5">
                      {rule503020.essencialPct.toFixed(1)}%
                    </div>
                    <div className="text-xs font-bold text-indigo-700">R$ {rule503020.essencialVal.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      Moradia, alimentação, saúde, água, luz, internet e transporte obrigatório.
                    </div>
                  </div>

                  {/* 30% Desejos */}
                  <div className="border-2 border-purple-200 rounded-xl p-3.5 bg-gradient-to-br from-purple-50/60 to-slate-50 text-left shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-purple-900">2. Desejos & Lazer</span>
                      <span className="text-[10px] bg-purple-200 text-purple-800 font-black px-2 py-0.5 rounded-full">Meta: 30%</span>
                    </div>
                    <div className="text-xl font-black text-purple-950 mt-1.5">
                      {rule503020.desejosPct.toFixed(1)}%
                    </div>
                    <div className="text-xs font-bold text-purple-700">R$ {rule503020.desejosVal.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      Restaurantes, passeios, compras voluntárias, vestuário e assinaturas.
                    </div>
                  </div>

                  {/* 20% Poupança */}
                  <div className="border-2 border-emerald-200 rounded-xl p-3.5 bg-gradient-to-br from-emerald-50/60 to-slate-50 text-left shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-emerald-900">3. Reserva & Poupança</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 font-black px-2 py-0.5 rounded-full">Meta: 20%</span>
                    </div>
                    <div className="text-xl font-black text-emerald-950 mt-1.5">
                      {rule503020.poupancaPct.toFixed(1)}%
                    </div>
                    <div className="text-xs font-bold text-emerald-700">R$ {rule503020.poupancaVal.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      Aportes para reserva, investimentos de rendimento e quitação futura.
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 4: TABELA ANALÍTICA DE CATEGORIAS COM CORES & STATUS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    4. Detalhamento Analítico dos Gastos por Categoria
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {categoryStats.length} categorias ativas no período
                  </span>
                </div>

                {/* Tabela de Alto Padrão com Header Escuro e Cores Vibrantes */}
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5">Categoria</th>
                        <th className="py-3 px-3 text-center">Distribuição Visual</th>
                        <th className="py-3 px-3 text-right">Valor Gasto</th>
                        <th className="py-3 px-3 text-right">Part. (%)</th>
                        <th className="py-3 px-3 text-right">Teto Orçado</th>
                        <th className="py-3 px-3.5 text-center">Status Orçamentário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {categoryStats.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                            Nenhum lançamento de despesa registrado para o mês selecionado.
                          </td>
                        </tr>
                      ) : (
                        categoryStats.map((item, idx) => (
                          <tr
                            key={item.categoria}
                            className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50'}
                          >
                            {/* Nome da Categoria com Badge Colorida */}
                            <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.themeColor?.hex || '#6366f1' }}
                              />
                              <span>{item.categoria}</span>
                            </td>

                            {/* Mini Barra de Progresso Visual Inline */}
                            <td className="py-2.5 px-3 text-center min-w-[90px]">
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(item.percentualDoTotal, 100)}%`,
                                    backgroundColor: item.themeColor?.hex || '#6366f1'
                                  }}
                                />
                              </div>
                            </td>

                            {/* Valor Gasto */}
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                              R$ {item.total.toFixed(2)}
                            </td>

                            {/* Participação Percentual */}
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">
                              {item.percentualDoTotal.toFixed(1)}%
                            </td>

                            {/* Teto Orçado */}
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {item.orcamento > 0 ? `R$ ${item.orcamento.toFixed(2)}` : '—'}
                            </td>

                            {/* Status Colorido */}
                            <td className="py-2.5 px-3.5 text-center">
                              {item.excedido ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Excedido (+R$ {item.desvio.toFixed(2)})
                                </span>
                              ) : item.orcamento > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Dentro da Meta
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  Regular
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Linha de Totais no Rodapé da Tabela */}
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                      <tr>
                        <td className="py-2.5 px-3.5 uppercase">Total Consolidado</td>
                        <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">100% dos Gastos</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700 text-sm">
                          R$ {monthlyExpensesTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">100.0%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {categoryStats.reduce((acc, c) => acc + (c.orcamento || 0), 0) > 0
                            ? `R$ ${categoryStats.reduce((acc, c) => acc + (c.orcamento || 0), 0).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center text-[10px] text-slate-500 uppercase">
                          Auditado
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Rodapé da Página 2 */}
              <div className="border-t border-slate-200 mt-6 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <span>Relatório Analítico & Projeção Financeira &bull; {monthName} / {selectedYear}</span>
                <span className="font-semibold text-slate-600">Página 2 de {totalReportPages}</span>
              </div>
            </div>


            {/* =================================================================
                PÁGINA 3: REPARTIÇÃO POR TITULAR, DESEMBOLSOS & DIRETRIZES ESTRATÉGICAS
                ================================================================= */}
            <div className="report-page bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200">
              
              {/* Mini Header da Página 3 */}
              <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-indigo-200 pb-2.5 mb-6">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  RELATÓRIO ANALÍTICO FINANCEIRO &bull; {monthName} / {selectedYear}
                </span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Página 3 de {totalReportPages}
                </span>
              </div>

              {/* SEÇÃO 5: REPARTIÇÃO POR TITULAR & CANAL DE PAGAMENTO */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Painel Titulares */}
                <div className="border-2 border-indigo-100 rounded-2xl p-4 bg-slate-50/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      5. Divisão de Gastos por Titular
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      {/* Talyson */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                            T
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">Talyson</span>
                            <span className="text-[10px] text-slate-500">Titular Financeiro</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-indigo-800 block text-sm">
                            R$ {individualStats.talyson.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {individualStats.talysonPct.toFixed(1)}% do orçamento
                          </span>
                        </div>
                      </div>

                      {/* Karla */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">
                            K
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">Karla</span>
                            <span className="text-[10px] text-slate-500">Titular Financeira</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-purple-800 block text-sm">
                            R$ {individualStats.karla.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {individualStats.karlaPct.toFixed(1)}% do orçamento
                          </span>
                        </div>
                      </div>

                      {/* Barra de Proporção Entre os Dois */}
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>Talyson ({individualStats.talysonPct.toFixed(0)}%)</span>
                          <span>Karla ({individualStats.karlaPct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-600" style={{ width: `${individualStats.talysonPct}%` }} />
                          <div className="h-full bg-purple-600" style={{ width: `${individualStats.karlaPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Painel Meios de Pagamento */}
                <div className="border-2 border-indigo-100 rounded-2xl p-4 bg-slate-50/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Canais de Pagamento & Liquidação
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      {/* Débito / Pix */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">Débito / Pix / À Vista</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">Sem impacto futuro</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-800 block text-sm">
                            R$ {operationStats.debitoPix.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {operationStats.debitoPixPct.toFixed(1)}% do total
                          </span>
                        </div>
                      </div>

                      {/* Cartão de Crédito */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-100 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center text-xs">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">Cartão de Crédito</span>
                            <span className="text-[10px] text-rose-700 font-semibold">Comprometimento a prazo</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-rose-800 block text-sm">
                            R$ {operationStats.credito.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {operationStats.creditoPct.toFixed(1)}% do total
                          </span>
                        </div>
                      </div>

                      {/* Relação de Cartões */}
                      {cards.length > 0 && (
                        <div className="text-[11px] text-slate-600 bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                          <strong>Cartões:</strong> {cards.map(c => c.nome).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 6: TABELA TOP 5 MAIORES GASTOS DO MÊS */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    6. Principais Desembolsos Individuais (Top 5 Maiores Gastos)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Transações com maior impacto financeiro
                  </span>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center">Rank</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3">Descrição / Classificação</th>
                        <th className="py-2.5 px-3">Titular</th>
                        <th className="py-2.5 px-3.5 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {topExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-3 text-center text-slate-400">
                            Nenhum gasto registrado.
                          </td>
                        </tr>
                      ) : (
                        topExpenses.map((t, idx) => {
                          const rankColors = [
                            'bg-amber-100 text-amber-900 border-amber-300', // #1 Ouro
                            'bg-slate-200 text-slate-800 border-slate-400', // #2 Prata
                            'bg-orange-100 text-orange-900 border-orange-300', // #3 Bronze
                            'bg-slate-100 text-slate-700 border-slate-300',
                            'bg-slate-100 text-slate-700 border-slate-300'
                          ];
                          const themeCat = CATEGORY_THEMES[t.origem] || { hex: '#64748b', bg: 'bg-slate-100', text: 'text-slate-800' };

                          return (
                            <tr key={t.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-block font-black text-[10px] px-2 py-0.5 rounded-full border ${rankColors[idx]}`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 font-semibold">{t.data}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeCat.hex }} />
                                  {t.origem}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                {t.classificacao}
                                {t.comentario && <span className="text-slate-400 text-[10px] block italic">{t.comentario}</span>}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-semibold">{t.individuo || 'Conjunto'}</td>
                              <td className="py-2 px-3.5 text-right font-mono font-black text-rose-700 text-sm">
                                R$ {(Number(t.saída) || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SEÇÃO 7: EVOLUÇÃO HISTÓRICA RECENTE */}
              {historicalComparison.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      7. Comparativo Histórico Recente de Desempenho
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Últimos meses registrados
                    </span>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3.5">Período</th>
                          <th className="py-2.5 px-3 text-right">Receitas</th>
                          <th className="py-2.5 px-3 text-right">Despesas</th>
                          <th className="py-2.5 px-3 text-right">Saldo Líquido</th>
                          <th className="py-2.5 px-3.5 text-center">Tendência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {historicalComparison.slice(0, 3).map((h) => {
                          const net = h.income - h.expense;
                          return (
                            <tr key={h.period} className="hover:bg-slate-50">
                              <td className="py-2 px-3.5 font-mono font-bold text-indigo-900">{h.period}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">+ R$ {h.income.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">- R$ {h.expense.toFixed(2)}</td>
                              <td className={`py-2 px-3 text-right font-mono font-black ${net >= 0 ? 'text-indigo-800' : 'text-rose-700'}`}>
                                {net >= 0 ? `+ R$ ${net.toFixed(2)}` : `- R$ ${Math.abs(net).toFixed(2)}`}
                              </td>
                              <td className="py-2 px-3.5 text-center">
                                {net >= 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    <ArrowUpRight className="w-3 h-3" /> Positivo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                    <ArrowDownRight className="w-3 h-3" /> Déficit
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SEÇÃO 8: ORIENTAÇÕES E SUGESTÕES PARA OS PRÓXIMOS MESES */}
              <div className="mb-6 bg-slate-50/90 border-2 border-indigo-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      8. Orientações Estratégicas & Sugestões para os Próximos Meses
                    </h3>
                    <p className="text-[11px] text-indigo-900 font-semibold">
                      Recomendações prioritárias geradas com base no seu padrão de consumo
                    </p>
                  </div>
                </div>

                {/* Cards de Recomendações */}
                <div className="space-y-2.5">
                  {recommendations.slice(0, 3).map((rec, idx) => {
                    const borderCol = rec.type === 'success' ? 'border-l-emerald-500' : rec.type === 'warning' ? 'border-l-amber-500' : rec.type === 'alert' ? 'border-l-rose-500' : 'border-l-indigo-500';
                    const badgeStyle = rec.type === 'success' ? 'bg-emerald-100 text-emerald-800' : rec.type === 'warning' ? 'bg-amber-100 text-amber-800' : rec.type === 'alert' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800';

                    return (
                      <div
                        key={idx}
                        className={`bg-white border border-slate-200 border-l-4 ${borderCol} rounded-xl p-3 shadow-sm text-xs space-y-1`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            {rec.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                            {rec.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                            {rec.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                            {rec.type === 'info' && <Zap className="w-4 h-4 text-indigo-600 shrink-0" />}
                            <span className="text-xs font-black">{rec.title}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${badgeStyle}`}>
                            {rec.type === 'success' ? 'Aporte Recomendado' : rec.type === 'warning' ? 'Atenção Orçamentária' : rec.type === 'alert' ? 'Prioridade Máxima' : 'Diretriz de Gestão'}
                          </span>
                        </div>
                        
                        <p className="text-slate-700 leading-relaxed pl-6 text-[11px] font-normal">
                          {rec.desc}
                        </p>

                        <div className="ml-6 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] font-semibold text-slate-800 flex items-start gap-1.5">
                          <span className="font-bold text-indigo-700 shrink-0">&bull; Ação Prática:</span>
                          <span className="text-slate-800">{rec.action}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plano de Ação Estruturado em 3 Etapas */}
                <div className="mt-3.5 pt-3 border-t border-indigo-200/80">
                  <h4 className="text-[11px] font-black uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    Roadmap Prático de Ação para o Próximo Mês:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                      <span className="font-black text-indigo-900 block mb-0.5">Passo 1: Tetos de Categorias</span>
                      <p className="text-slate-600 leading-snug">
                        Ajuste tetos orçamentários na aba Planejamento para as categorias líderes.
                      </p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                      <span className="font-black text-indigo-900 block mb-0.5">Passo 2: Contas Fixas</span>
                      <p className="text-slate-600 leading-snug">
                        Reserve R$ {fixedStats.totalFixas.toFixed(2)} para despesas fixas logo na entrada dos salários.
                      </p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                      <span className="font-black text-indigo-900 block mb-0.5">Passo 3: Aporte Mínimo</span>
                      <p className="text-slate-600 leading-snug">
                        Separe no mínimo 10% a 20% das receitas antes de efetuar compras supérfluas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RODAPÉ OFICIAL DO DOCUMENTO (ASSINATURA & METADADOS) */}
              <div className="border-t-2 border-slate-200 pt-3 text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Documento emitido automaticamente pelo Sistema de Inteligência & Gestão Financeira.</span>
                </div>
                <div className="font-mono text-right text-slate-600">
                  REF: <strong className="text-slate-900">{selectedPeriodKey}</strong> &bull; SCORE: <strong className="text-indigo-700">{financialHealthScore}/100</strong> &bull; Emissão: {issueDate}
                </div>
              </div>

              {/* Rodapé da Página 3 */}
              <div className="border-t border-slate-200 mt-4 pt-2.5 flex justify-between items-center text-[10px] text-slate-400">
                <span>Relatório Analítico & Projeção Financeira &bull; {monthName} / {selectedYear}</span>
                <span className="font-semibold text-slate-600">Página 3 de {totalReportPages}</span>
              </div>
            </div>


            {/* =================================================================
                PÁGINAS DE MOVIMENTAÇÕES: DEMONSTRATIVO INTEGRAL DOS LANÇAMENTOS DO MÊS
                Se o volume de lançamentos for grande, distribui ordenadamente em páginas A4 adicionais
                ================================================================= */}
            {movementPages.map((pageRows, pageIndex) => {
              const currentPageNumber = 4 + pageIndex;
              const isFirstMovementsPage = pageIndex === 0;
              const isLastMovementsPage = pageIndex === movementPages.length - 1;

              return (
                <div
                  key={`movements-page-${pageIndex}`}
                  className="report-page bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200"
                >
                  {/* Mini Header da Página */}
                  <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-indigo-200 pb-2.5 mb-6">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      RELATÓRIO ANALÍTICO FINANCEIRO &bull; {monthName} / {selectedYear}
                    </span>
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Página {currentPageNumber} de {totalReportPages}
                    </span>
                  </div>

                  {/* TÍTULO DA SEÇÃO 9 (Exibido na primeira página de lançamentos) */}
                  {isFirstMovementsPage ? (
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          9. Demonstrativo Geral de Movimentações ({monthName} / {selectedYear})
                        </h3>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="bg-slate-100 font-bold text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-300">
                            Total: {allMonthlyMovements.length} lançamentos
                            {movementPages.length > 1 && ` (Pág. ${pageIndex + 1}/${movementPages.length})`}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Extrato detalhado de todas as receitas e despesas registradas e contabilizadas no período de referência.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        9. Demonstrativo Geral de Movimentações (Continuação &bull; Pág. {pageIndex + 1}/{movementPages.length})
                      </h3>
                      <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                        Exibindo registros {FIRST_PAGE_MOVEMENT_SIZE + (pageIndex - 1) * SUBSEQUENT_PAGE_MOVEMENT_SIZE + 1} a {Math.min(allMonthlyMovements.length, FIRST_PAGE_MOVEMENT_SIZE + pageIndex * SUBSEQUENT_PAGE_MOVEMENT_SIZE)} de {allMonthlyMovements.length}
                      </span>
                    </div>
                  )}

                  {/* Resumo Rápido no topo da tabela (Apenas na primeira página de lançamentos) */}
                  {isFirstMovementsPage && (
                    <div className="grid grid-cols-3 gap-3 mb-4 text-xs font-semibold">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-3 flex items-center justify-between">
                        <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" /> Entradas
                        </span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          + R$ {monthlyIncome.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 px-3 flex items-center justify-between">
                        <span className="text-rose-800 font-bold flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4 text-rose-600" /> Saídas
                        </span>
                        <span className="font-mono font-black text-rose-700 text-sm">
                          - R$ {monthlyExpensesTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className={`border rounded-xl p-2.5 px-3 flex items-center justify-between ${
                        netSavings >= 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                        <span className="font-bold flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" /> Saldo Líquido
                        </span>
                        <span className="font-mono font-black text-sm">
                          {netSavings >= 0 ? `+ R$ ${netSavings.toFixed(2)}` : `- R$ ${Math.abs(netSavings).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TABELA DE MOVIMENTAÇÕES DESTA PÁGINA (Colunas ajustadas para não cortar informações) */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm mb-5 bg-white">
                    <table className="w-full text-left text-xs table-fixed">
                      <colgroup>
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '32%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '12%' }} />
                      </colgroup>
                      <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-2 text-center">Data</th>
                          <th className="py-2.5 px-2.5 text-left">Categoria</th>
                          <th className="py-2.5 px-3 text-left">Descrição / Histórico</th>
                          <th className="py-2.5 px-1 text-center">Tipo</th>
                          <th className="py-2.5 px-2 text-center">Conta</th>
                          <th className="py-2.5 px-1.5 text-center">Titular</th>
                          <th className="py-2.5 px-2.5 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pageRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                              Nenhuma movimentação registrada no mês de {monthName} de {selectedYear}.
                            </td>
                          </tr>
                        ) : (
                          pageRows.map((t, idx) => {
                            const isIncome = Number(t.entrada) > 0;
                            const amount = isIncome ? Number(t.entrada) : Number(t.saída) || 0;
                            const themeCat = CATEGORY_THEMES[t.origem] || { hex: '#64748b', bg: 'bg-slate-100', text: 'text-slate-800' };

                            return (
                              <tr
                                key={t.id || `${pageIndex}-${idx}`}
                                className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                              >
                                {/* Data formatada e centralizada */}
                                <td className="py-2 px-1.5 font-mono font-bold text-slate-600 text-center text-[10px] whitespace-nowrap align-middle">
                                  {formatDateDisplay(t.data)}
                                </td>

                                {/* Categoria sem cortes */}
                                <td className="py-2 px-2.5 align-middle">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: isIncome ? '#10b981' : themeCat.hex }}
                                    />
                                    <span className="text-[10px] font-bold text-slate-800 break-words leading-tight">
                                      {t.origem || (isIncome ? 'Receita' : 'Despesa')}
                                    </span>
                                  </div>
                                </td>

                                {/* Descrição / Classificação e Comentário sem cortes */}
                                <td className="py-2 px-3 align-middle">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block text-[11px] leading-tight break-words">
                                      {t.classificacao || '—'}
                                    </span>
                                    {t.comentario && (
                                      <span className="text-[9.5px] text-slate-500 italic block break-words mt-0.5 leading-snug">
                                        {t.comentario}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Tipo (Entrada vs Saída) */}
                                <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    isIncome
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}>
                                    {isIncome ? 'Entrada' : 'Saída'}
                                  </span>
                                </td>

                                {/* Conta / Meio */}
                                <td className="py-2 px-2 text-center align-middle">
                                  {t.conta ? (
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px] text-slate-700 font-semibold border border-slate-200 inline-block break-words max-w-full">
                                      {t.conta}
                                    </span>
                                  ) : t.operacao ? (
                                    <span className="text-slate-500 text-[9.5px]">{t.operacao}</span>
                                  ) : (
                                    <span className="text-slate-400 text-[9.5px]">—</span>
                                  )}
                                </td>

                                {/* Titular */}
                                <td className="py-2 px-1.5 text-center align-middle whitespace-nowrap">
                                  <span className="font-bold text-[9.5px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 inline-block">
                                    {t.individuo || 'Conjunto'}
                                  </span>
                                </td>

                                {/* Valor */}
                                <td className={`py-2 px-2.5 text-right font-mono font-black text-[11px] whitespace-nowrap align-middle ${
                                  isIncome ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                  {isIncome ? `+ R$ ${amount.toFixed(2)}` : `- R$ ${amount.toFixed(2)}`}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {/* Totalizador no Rodapé (Exibido na última página de movimentações) */}
                      {isLastMovementsPage && (
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 uppercase text-[10px]">
                              Total Consolidado ({allMonthlyMovements.length} Registros)
                            </td>
                            <td colSpan={3} className="py-2.5 px-2 text-right font-bold text-slate-600 text-[10px]">
                              Entradas: R$ {monthlyIncome.toFixed(2)} | Saídas: R$ {monthlyExpensesTotal.toFixed(2)}
                            </td>
                            <td className={`py-2.5 px-2.5 text-right font-mono font-black text-xs whitespace-nowrap ${
                              netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {netSavings >= 0 ? `+ R$ ${netSavings.toFixed(2)}` : `- R$ ${Math.abs(netSavings).toFixed(2)}`}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Informação Final e Rodapé Oficial */}
                  <div className="border-t-2 border-slate-200 pt-3 text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Demonstrativo de auditoria contábil pessoal e familiar. Conferência eletrônica de lançamentos.</span>
                    </div>
                    <div className="font-mono text-right text-slate-600">
                      REF: <strong className="text-slate-900">{selectedPeriodKey}</strong> &bull; Total Lançamentos: <strong className="text-indigo-700">{allMonthlyMovements.length}</strong>
                    </div>
                  </div>

                  {/* Rodapé da Página */}
                  <div className="border-t border-slate-200 mt-4 pt-2.5 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Relatório Analítico & Projeção Financeira &bull; {monthName} / {selectedYear}</span>
                    <span className="font-semibold text-slate-600">Página {currentPageNumber} de {totalReportPages}</span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Rodapé do Modal com Informações Rápidas */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Documento formatado em padrão executivo A4 ({totalReportPages} páginas incluindo extrato de movimentações). Pronto para salvar ou imprimir.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Usar diálogo de impressão
            </button>
            <span>&bull;</span>
            <button
              onClick={handleDownloadPdf}
              className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
            >
              Baixar Arquivo PDF Completo (.pdf)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
