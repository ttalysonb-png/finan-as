import React, { useState } from 'react';
import { X, Copy, Check, Download, Database, Terminal, ShieldCheck, ExternalLink } from 'lucide-react';
import { SUPABASE_MIGRATIONS_SQL } from '../lib/migrationsSql';

interface MigrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const MigrationsModal: React.FC<MigrationsModalProps> = ({ isOpen, onClose, showToast }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATIONS_SQL);
    setCopied(true);
    showToast('Script SQL copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_MIGRATIONS_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '20260905_supabase_fixed_accounts_migration.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Arquivo de migration baixado com sucesso!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Arquivo de Migrations do Supabase
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SQL Pronto
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Execute este script no SQL Editor do seu Supabase para criar as tabelas de Contas Fixas e Parcelas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instuctions Banner */}
        <div className="px-5 py-3 bg-indigo-950/30 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Passo a passo: <strong>Acesse seu Supabase Dashboard</strong> &rarr; <strong>SQL Editor</strong> &rarr; <strong>New Query</strong> &rarr; <strong>Cole e clique em Run</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Baixar .sql
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs text-slate-300 select-all leading-relaxed whitespace-pre-wrap">
          {SUPABASE_MIGRATIONS_SQL}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Script idempotente (usa IF NOT EXISTS) e seguro para rodar múltiplas vezes.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
