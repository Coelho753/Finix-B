const LoanRequest = require('../models/LoanRequest');
const { calculateLoan, isAllowedTypeForRole } = require('../services/loanService');
const { average, mode, buildMonthlyChart } = require('../services/reportService');

async function requestLoan(req, res) {
  const { type, principal } = req.body;

  if (!type || !principal || Number(principal) <= 0) {
    return res.status(400).json({ message: 'Tipo e valor principal são obrigatórios' });
  }

  if (!isAllowedTypeForRole(req.user.role, type) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Tipo de empréstimo não permitido para seu perfil' });
  }

  const data = calculateLoan(type, Number(principal));

  const loan = await LoanRequest.create({
    userId: req.user._id,
    userRoleAtRequest: req.user.role,
    type,
    principal: Number(principal),
    interestRate: data.interestRate,
    totalToPay: data.totalToPay,
    installments: data.installments,
    status: Number(principal) > 5000 ? 'analisando' : 'solicitado',
  });

  return res.status(201).json({
    id: loan._id,
    status: loan.status,
    resumo: {
      valorSolicitado: loan.principal,
      totalComJuros: loan.totalToPay,
      parcela: data.installmentValue,
      taxaAplicada: `${loan.interestRate * 100}%`,
    },
  });
}

async function getLoanReport(req, res) {
  const loans = await LoanRequest.find().sort({ createdAt: 1 });
  const principals = loans.map((item) => item.principal);
  const totals = loans.map((item) => item.totalToPay);

  return res.json({
    quantidadeSolicitacoes: loans.length,
    mediaValorSolicitado: average(principals),
    modaValorSolicitado: mode(principals),
    mediaValorTotal: average(totals),
    modaValorTotal: mode(totals),
    graficoMensalValoresSolicitados: buildMonthlyChart(loans),
  });
}

module.exports = { requestLoan, getLoanReport };
