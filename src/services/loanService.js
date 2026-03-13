const RATE_BY_TYPE = {
  socio_12x: 0.23,
  socio_30d: 0.08,
  terceiro_12x: 0.33,
  terceiro_30d: 0.18,
};

const INSTALLMENTS_BY_TYPE = {
  socio_12x: 12,
  socio_30d: 1,
  terceiro_12x: 12,
  terceiro_30d: 1,
};

function calculateLoan(type, principal) {
  const interestRate = RATE_BY_TYPE[type];
  if (interestRate === undefined) {
    throw new Error('Tipo de empréstimo inválido');
  }
  const totalToPay = Number((principal * (1 + interestRate)).toFixed(2));
  const installments = INSTALLMENTS_BY_TYPE[type];
  const installmentValue = Number((totalToPay / installments).toFixed(2));

  return { interestRate, totalToPay, installments, installmentValue };
}

function isAllowedTypeForRole(role, type) {
  if (role === 'socio') {
    return type.startsWith('socio_');
  }
  if (role === 'terceiro') {
    return type.startsWith('terceiro_');
  }
  return true;
}

module.exports = { calculateLoan, isAllowedTypeForRole };
