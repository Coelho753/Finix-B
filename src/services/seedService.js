const PageContent = require('../models/PageContent');

async function seedDefaultContent() {
  const existing = await PageContent.findOne({ slug: 'emprestimos' });
  if (existing) return;

  await PageContent.create({
    slug: 'emprestimos',
    title: 'Regras de Empréstimos (destaque obrigatório)',
    tabs: [
      {
        key: 'terceiros',
        label: 'Terceiros',
        highlighted: [
          'Necessidade de fiador é obrigatória.',
          'Taxa de 18% para empréstimos em até 30 dias.',
          'Taxa de 33% para empréstimos em até 12x.',
          'Multa de 10% até 15 dias; após isso 1% ao dia.',
        ],
        text: [
          'Pagamentos: segunda a sexta, das 08:00 às 20:00.',
          'O fiador é legalmente responsável em caso de inadimplência.',
          'Comissão do fiador: 5% sobre o valor total do empréstimo.',
        ],
      },
      {
        key: 'socios',
        label: 'Sócios',
        highlighted: [
          'R$ 200,00 mensais pagos todo dia 16.',
          'Pagamento até 20h; multa de 10% em caso de atraso.',
          'Taxa de 23% sobre o valor emprestado em até 12x.',
          'Taxa de 8% para empréstimo em até 30 dias.',
        ],
        text: [
          'Análise simples para valores até R$ 5.000,00.',
          'Acima de R$ 5.000,00: análise cuidadosa e pedido com antecedência.',
          'Solicitação via grupo com valor exato; liberação em até 24h.',
          'Desistência/rescisão: aportes bloqueados até fim do contrato sem rendimentos.',
          'Leilão de aporte permitido para participantes ou fundos F1/F2.',
        ],
      },
      {
        key: 'simulacao',
        label: 'Simulação',
        highlighted: [
          'Coleta somente dados da solicitação e geração de relatório.',
          'Relatório contém média e moda dos valores solicitados.',
        ],
        text: [
          'Sócio 10.000 + 23% = 12.300 em 12x.',
          'Sócio 30 dias: 10.000 + 8% = 10.800.',
          'Terceiro 30 dias: 10.000 + 18% = 11.800.',
        ],
      },
    ],
  });
}

module.exports = { seedDefaultContent };
