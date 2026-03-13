const PageContent = require('../models/PageContent');

async function getLoanPage(req, res) {
  const content = await PageContent.findOne({ slug: 'emprestimos' });
  if (!content) {
    return res.status(404).json({ message: 'Conteúdo não configurado' });
  }
  return res.json(content);
}

module.exports = { getLoanPage };
