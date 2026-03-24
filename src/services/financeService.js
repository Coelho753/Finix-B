const FundConfig = require('../models/FundConfig');
const Transaction = require('../models/Transaction');
const PaymentNotification = require('../models/PaymentNotification');
const User = require('../models/User');
const { sanitizeInput } = require('./authService');

function serializeFundConfig(doc) {
  const payload = {
    f1_balance: Number(doc?.f1_balance || 0),
    f2_balance: Number(doc?.f2_balance || 0),
    f1_description: doc?.f1_description || '',
    f2_description: doc?.f2_description || '',
    taxa_lucro: Number(doc?.taxa_lucro || 0),
    aportes_override: Object.fromEntries((doc?.aportes_override || new Map()).entries?.() || Object.entries(doc?.aportes_override || {})),
  };

  // backward compatibility keys
  payload.f1_value = payload.f1_balance;
  payload.f2_value = payload.f2_balance;
  return payload;
}

async function getFundData() {
  const fundData = await FundConfig.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { new: true, upsert: true }
  );

  return serializeFundConfig(fundData);
}

async function saveFundData(payload) {
  const rawOverrides = payload?.aportes_override && typeof payload.aportes_override === 'object'
    ? payload.aportes_override
    : {};

  const sanitizedOverrides = Object.fromEntries(
    Object.entries(rawOverrides).map(([name, value]) => [sanitizeInput(name), Number(value) || 0])
  );

  const updates = {
    f1_balance: Number(payload?.f1_balance ?? payload?.f1_value) || 0,
    f1_description: sanitizeInput(payload?.f1_description || ''),
    f2_balance: Number(payload?.f2_balance ?? payload?.f2_value) || 0,
    f2_description: sanitizeInput(payload?.f2_description || ''),
    taxa_lucro: Number(payload?.taxa_lucro) || 0,
    aportes_override: sanitizedOverrides,
  };

  const saved = await FundConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: updates, $setOnInsert: { key: 'default' } },
    { new: true, upsert: true, runValidators: true }
  );

  return serializeFundConfig(saved);
}

function calculateTaxBreakdown(transaction) {
  const parcelas = Array.isArray(transaction.parcelas) ? transaction.parcelas : [];
  const jurosTotal = Number((transaction.valor_total - transaction.valor_emprestimo).toFixed(2));
  const parteFinix = Number((transaction.valor_emprestimo * 0.03).toFixed(2));
  const custoFiadorInterno = transaction.tipo === 'terceiro'
    ? Number((transaction.valor_emprestimo * 0.05).toFixed(2))
    : 0;
  const parteGrupo = Number((jurosTotal - parteFinix - custoFiadorInterno).toFixed(2));
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
    modalidade: transaction.modalidade,
    valor: transaction.valor_emprestimo,
    taxa: transaction.taxa,
    juros_total: jurosTotal,
    parte_finix: parteFinix,
    parte_grupo: parteGrupo,
    parcela: valorParcela,
    fiador: transaction.fiador_nome || null,
    parcelas_pagas: parcelasPagas,
    quantidade_parcelas: transaction.quantidade_parcelas,
    divida_restante: dividaRestante,
    status: transaction.status,
    desistencia: Boolean(transaction.desistencia),
    fiador_assumiu: Boolean(transaction.fiador_assumiu),
  };
}

function buildContributionRows(socios, confirmedNotifications, overrides) {
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

  for (const notification of confirmedNotifications) {
    if (!socioIds.has(String(notification.user_id))) continue;
    if (notification.transaction_id || notification.parcela_numero) continue;

    const row = contributionRows.get(String(notification.user_id));
    if (!row) continue;

    row.meses_pagos.push(notification.mes_referencia);
    row.total_aportado = Number((row.total_aportado + notification.valor).toFixed(2));
    row.quantidade_meses_pagos += 1;
  }

  for (const row of contributionRows.values()) {
    const manual = overrides[row.socio_nome];
    if (manual !== undefined) {
      const manualValue = Number(manual) || 0;
      row.aporte_manual = manualValue;
      row.total_aportado = Number((row.total_aportado + manualValue).toFixed(2));
      row.override_aplicado = true;
    }
  }

  return Array.from(contributionRows.values());
}

function buildOverdueFiadorAlerts(transactions) {
  const now = new Date();
  return transactions.flatMap((transaction) => {
    if (!transaction.fiador_nome) return [];

    const overdueParcelas = (transaction.parcelas || []).filter((parcela) => {
      if (parcela.paga || !parcela.data_vencimento) return false;
      return new Date(parcela.data_vencimento) < now;
    });

    if (overdueParcelas.length === 0) return [];

    return [{
      transaction_id: transaction._id,
      nome: transaction.nome,
      fiador: transaction.fiador_nome,
      status: transaction.status,
      parcelas_vencidas: overdueParcelas.length,
      valor_em_atraso: Number(overdueParcelas.reduce((sum, parcela) => sum + parcela.valor, 0).toFixed(2)),
    }];
  });
}

function buildHistoryRows(transactions, notifications) {
  const paymentRows = notifications.map((notification) => ({
    _id: notification._id,
    tipo: notification.transaction_id ? 'pagamento' : 'aporte',
    status: notification.status,
    nome: notification.user_name,
    referencia: notification.mes_referencia,
    valor: notification.valor,
    created_at: notification.created_at,
    observacao: notification.mensagem || '',
  }));

  const transactionRows = transactions.flatMap((transaction) => {
    const rows = [];
    if (transaction.desistencia) {
      rows.push({
        _id: `desistencia-${transaction._id}`,
        tipo: 'desistencia',
        status: transaction.status,
        nome: transaction.nome,
        referencia: transaction.modalidade,
        valor: transaction.divida_restante || transaction.valor_total,
        created_at: transaction.updated_at || transaction.created_at,
        observacao: transaction.fiador_assumiu ? 'Fiador assumiu a dívida' : 'Desistência sem transferência',
      });
    }

    if (transaction.status === 'inadimplente') {
      rows.push({
        _id: `inadimplencia-${transaction._id}`,
        tipo: 'inadimplencia',
        status: transaction.status,
        nome: transaction.nome,
        referencia: transaction.modalidade,
        valor: transaction.valor_total,
        created_at: transaction.updated_at || transaction.created_at,
        observacao: 'Empréstimo marcado como inadimplente',
      });
    }

    return rows;
  });

  return [...paymentRows, ...transactionRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function buildFinanceSummary() {
  const [fundData, transactions, socios, notifications] = await Promise.all([
    getFundData(),
    Transaction.find({}).sort({ created_at: -1 }),
    User.find({ role: 'socio' }, 'name email role').sort({ name: 1 }),
    PaymentNotification.find({}).sort({ created_at: -1 }),
  ]);

  const confirmedNotifications = notifications.filter((notification) => notification.status === 'confirmado');
  const contributionRows = buildContributionRows(socios, confirmedNotifications, fundData.aportes_override || {});

  const taxBreakdown = transactions.map(calculateTaxBreakdown);
  const totals = taxBreakdown.reduce((acc, row) => ({
    valor: acc.valor + row.valor,
    juros_total: acc.juros_total + row.juros_total,
    parte_finix: acc.parte_finix + row.parte_finix,
    parte_grupo: acc.parte_grupo + row.parte_grupo,
    parcela: acc.parcela + row.parcela,
    parcelas_pagas: acc.parcelas_pagas + row.parcelas_pagas,
    divida_restante: acc.divida_restante + row.divida_restante,
  }), {
    valor: 0,
    juros_total: 0,
    parte_finix: 0,
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

  const rendimentoPorSocio = contributionRows.map((row) => ({
    ...row,
    lucro_estimado: lucroEstimadoPorSocio,
    saldo_estimado: Number((row.total_aportado + lucroEstimadoPorSocio).toFixed(2)),
  }));

  return {
    funds: fundData,
    aportes_por_socio: contributionRows,
    rendimento_por_socio: rendimentoPorSocio,
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
    alertas_fiador_em_atraso: buildOverdueFiadorAlerts(transactions),
    historico_geral: buildHistoryRows(transactions, notifications),
  };
}

async function getSocioFinancialSummary(userId) {
  const [user, notifications, summary] = await Promise.all([
    User.findById(userId, 'name email role'),
    PaymentNotification.find({ user_id: userId, status: 'confirmado' }).sort({ created_at: -1 }),
    buildFinanceSummary(),
  ]);

  if (!user || user.role !== 'socio') {
    return null;
  }

  const contributionNotifications = notifications.filter(
    (notification) => !notification.transaction_id && !notification.parcela_numero
  );

  const manualOverride = summary.funds.aportes_override?.[user.name];
  const totalConfirmado = Number(
    contributionNotifications.reduce((total, notification) => total + notification.valor, 0).toFixed(2)
  );
  const aporteManual = manualOverride !== undefined ? Number(manualOverride) || 0 : 0;
  const totalAportado = Number((totalConfirmado + aporteManual).toFixed(2));

  return {
    socio_id: user._id,
    socio_nome: user.name,
    total_aportado: totalAportado,
    aporte_manual: aporteManual,
    quantidade_meses_pagos: contributionNotifications.length,
    meses_pagos: contributionNotifications.map((notification) => notification.mes_referencia),
    lucro_estimado: summary.lucro_estimado_por_socio.lucro_por_socio,
    saldo_estimado: Number((totalAportado + summary.lucro_estimado_por_socio.lucro_por_socio).toFixed(2)),
  };
}

async function getGeneralHistory() {
  const [transactions, notifications] = await Promise.all([
    Transaction.find({}).sort({ created_at: -1 }),
    PaymentNotification.find({}).sort({ created_at: -1 }),
  ]);

  return buildHistoryRows(transactions, notifications);
}

module.exports = {
  getFundData,
  saveFundData,
  calculateTaxBreakdown,
  buildFinanceSummary,
  getSocioFinancialSummary,
  getGeneralHistory,
};
