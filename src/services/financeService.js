const FundConfig = require('../models/FundConfig');
const Transaction = require('../models/Transaction');
const PaymentNotification = require('../models/PaymentNotification');
const User = require('../models/User');
const { sanitizeInput } = require('./authService');

async function getFundData() {
  const fundData = await FundConfig.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { new: true, upsert: true }
  );

  return fundData;
}

async function saveFundData(payload) {
  const updates = {
    f1_value: Number(payload?.f1_value) || 0,
    f1_description: sanitizeInput(payload?.f1_description || ''),
    f2_value: Number(payload?.f2_value) || 0,
    f2_description: sanitizeInput(payload?.f2_description || ''),
  };

  return FundConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: updates, $setOnInsert: { key: 'default' } },
    { new: true, upsert: true, runValidators: true }
  );
}

function calculateTaxBreakdown(transaction) {
  const parcelas = Array.isArray(transaction.parcelas) ? transaction.parcelas : [];
  const jurosTotal = Number((transaction.valor_total - transaction.valor_emprestimo).toFixed(2));
  const parteFinix = Number((transaction.valor_emprestimo * 0.03).toFixed(2));
  const parteFiador = transaction.tipo === 'terceiro'
    ? Number((transaction.valor_emprestimo * 0.05).toFixed(2))
    : 0;
  const parteGrupo = Number((jurosTotal - parteFinix - parteFiador).toFixed(2));
  const parcelasPagas = parcelas.filter((parcela) => parcela.paga).length;
  const dividaRestante = Number(
    parcelas
      .filter((parcela) => !parcela.paga)
      .reduce((total, parcela) => total + parcela.valor, 0)
      .toFixed(2)
  );
  const valorParcela = parcelas.length > 0
    ? Number(parcelas[0].valor.toFixed(2))
    : Number((transaction.valor_total / Math.max(transaction.quantidade_parcelas, 1)).toFixed(2));

  return {
    transaction_id: transaction._id,
    nome: transaction.nome,
    tipo: transaction.tipo,
    valor: transaction.valor_emprestimo,
    taxa: transaction.taxa,
    juros_total: jurosTotal,
    parte_finix: parteFinix,
    parte_fiador: parteFiador,
    parte_grupo: parteGrupo,
    parcela: valorParcela,
    fiador: transaction.fiador_nome || null,
    parcelas_pagas: parcelasPagas,
    quantidade_parcelas: transaction.quantidade_parcelas,
    divida_restante: dividaRestante,
  };
}

async function buildFinanceSummary() {
  const [fundData, transactions, socios, confirmedContributions] = await Promise.all([
    getFundData(),
    Transaction.find({}).sort({ created_at: -1 }),
    User.find({ role: 'socio' }, 'name email role').sort({ name: 1 }),
    PaymentNotification.find({ status: 'confirmado' }).sort({ created_at: -1 }),
  ]);

  const socioIds = new Set(socios.map((user) => String(user._id)));
  const contributionRows = new Map(
    socios.map((user) => [String(user._id), {
      socio_id: user._id,
      socio_nome: user.name,
      socio_email: user.email,
      meses_pagos: [],
      total_aportado: 0,
      quantidade_meses_pagos: 0,
    }])
  );

  for (const notification of confirmedContributions) {
    if (!socioIds.has(String(notification.user_id))) continue;
    if (notification.transaction_id || notification.parcela_numero) continue;

    const row = contributionRows.get(String(notification.user_id));
    if (!row) continue;

    row.meses_pagos.push(notification.mes_referencia);
    row.total_aportado = Number((row.total_aportado + notification.valor).toFixed(2));
    row.quantidade_meses_pagos += 1;
  }

  const taxBreakdown = transactions.map(calculateTaxBreakdown);
  const totals = taxBreakdown.reduce((acc, row) => ({
    valor: acc.valor + row.valor,
    juros_total: acc.juros_total + row.juros_total,
    parte_finix: acc.parte_finix + row.parte_finix,
    parte_fiador: acc.parte_fiador + row.parte_fiador,
    parte_grupo: acc.parte_grupo + row.parte_grupo,
    parcela: acc.parcela + row.parcela,
    parcelas_pagas: acc.parcelas_pagas + row.parcelas_pagas,
    divida_restante: acc.divida_restante + row.divida_restante,
  }), {
    valor: 0,
    juros_total: 0,
    parte_finix: 0,
    parte_fiador: 0,
    parte_grupo: 0,
    parcela: 0,
    parcelas_pagas: 0,
    divida_restante: 0,
  });

  const revenueByPeriod = {
    f1: { receita_bruta: 0, receita_liquida: 0, quantidade: 0 },
    f2: { receita_bruta: 0, receita_liquida: 0, quantidade: 0 },
  };

  for (const row of taxBreakdown) {
    const bucket = row.tipo === 'socio' ? revenueByPeriod.f1 : revenueByPeriod.f2;
    bucket.receita_bruta = Number((bucket.receita_bruta + row.juros_total).toFixed(2));
    bucket.receita_liquida = Number((bucket.receita_liquida + row.parte_grupo).toFixed(2));
    bucket.quantidade += 1;
  }

  const lucroTotalGrupo = Number((revenueByPeriod.f1.receita_liquida + revenueByPeriod.f2.receita_liquida).toFixed(2));
  const lucroEstimadoPorSocio = socios.length > 0
    ? Number((lucroTotalGrupo / socios.length).toFixed(2))
    : 0;

  return {
    funds: fundData,
    aportes_por_socio: Array.from(contributionRows.values()),
    discriminacao_taxas: {
      linhas: taxBreakdown,
      totais: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Number(value.toFixed(2))])),
    },
    receita_por_periodo: revenueByPeriod,
    lucro_estimado_por_socio: {
      socios_ativos: socios.length,
      lucro_total_grupo: lucroTotalGrupo,
      lucro_por_socio: lucroEstimadoPorSocio,
      retorno_total: Number((lucroEstimadoPorSocio * socios.length).toFixed(2)),
    },
  };
}

async function getSocioFinancialSummary(userId) {
  const [user, notifications] = await Promise.all([
    User.findById(userId, 'name email role'),
    PaymentNotification.find({ user_id: userId, status: 'confirmado' }).sort({ created_at: -1 }),
  ]);

  if (!user || user.role !== 'socio') {
    return null;
  }

  const contributionNotifications = notifications.filter(
    (notification) => !notification.transaction_id && !notification.parcela_numero
  );

  return {
    socio_id: user._id,
    socio_nome: user.name,
    total_aportado: Number(
      contributionNotifications.reduce((total, notification) => total + notification.valor, 0).toFixed(2)
    ),
    quantidade_meses_pagos: contributionNotifications.length,
    meses_pagos: contributionNotifications.map((notification) => notification.mes_referencia),
  };
}

module.exports = {
  getFundData,
  saveFundData,
  calculateTaxBreakdown,
  buildFinanceSummary,
  getSocioFinancialSummary,
};
