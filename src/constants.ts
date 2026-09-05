export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DEFAULT_CATEGORIES_MAP: Record<string, string[]> = {
  'Infraestrutura': ['Aluguel', 'Condomínio', 'Luz (Energia)', 'Água', 'Gás', 'IPTU', 'Manutenção Doméstica', 'Internet'],
  'Comunicação': ['Internet Fibra', 'Telefone Fixo', 'Celular/Plano', 'TV por Assinatura', 'Streaming'],
  'Cartão de Crédito': ['Fatura Nubank', 'Fatura Visa', 'Fatura Mastercard', 'Anuidade'],
  'Educação': ['Cursos', 'Faculdade/Pós', 'Livros', 'Mensalidade Escolar', 'Idiomas'],
  'Crianças': ['Escola/Creche', 'Brinquedos', 'Vestuário Infantil', 'Atividades/Esportes', 'Pediatra/Saúde', 'Pensão'],
  'Cuidados Pessoais': ['Salão/Barbearia', 'Cosméticos/Perfumaria', 'Farmácia', 'Estética/Academia', 'Plano de Saúde'],
  'Dia a Dia': ['Supermercado', 'Padaria', 'Feira/Hortifruti', 'Lanches', 'Conveniência'],
  'Transporte': ['Combustível', 'Uber/App', 'Manutenção Veicular', 'Seguro Veicular', 'IPVA/Licenciamento', 'Financiamento'],
  'Lazer': ['Viagens', 'Streaming/Assinaturas', 'Restaurantes/Bares', 'Cinema/Shows', 'Hobbies'],
  'Emprestado': ['Empréstimo Concedido', 'Devolução de Empréstimo', 'Ajuste de Saldo'],
  'Presentes': ['Aniversário', 'Natal', 'Datas Especiais', 'Lembrancinhas'],
  'Trabalho': ['Salário', 'Bônus/PLR', 'Freelance/Serviços', 'Ferramentas/Softwares'],
  'Transferência': ['Entre Contas Próprias', 'Aporte Investimentos', 'Resgate Investimentos'],
  'Vestuário': ['Roupas', 'Calçados', 'Acessórios']
};

export const addMonthsToDate = (dateStr: string, monthsToAdd: number): string => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) + monthsToAdd;
  const day = parts[2];

  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}-${day}`;
};

export const addMonthsToPeriod = (periodStr: string, monthsToAdd: number): string => {
  const parts = periodStr.split('-');
  if (parts.length < 2) return periodStr;
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) + monthsToAdd;

  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};

// Helper para calcular a fatura do cartão considerando a regra do dia 16:
export const getTransactionInvoicePeriod = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr.substring(0, 7);
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (day >= 16) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const formatCurrency = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
