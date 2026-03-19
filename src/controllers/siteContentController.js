const PageContent = require('../models/PageContent');
const { sanitizeInput } = require('../services/authService');

function serializeContent(content) {
  return {
    _id: content._id,
    section_key: content.slug,
    title: content.title,
    content: JSON.stringify(content.tabs || []),
    updated_at: content.updatedAt,
  };
}

async function listSiteContent(req, res) {
  const contents = await PageContent.find({}).sort({ slug: 1 });
  return res.json(contents.map(serializeContent));
}

async function updateSiteContent(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const title = sanitizeInput(req.body?.title);
  const rawContent = req.body?.content;
  if (!title) {
    return res.status(400).json({ message: 'Título é obrigatório' });
  }

  const current = await PageContent.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: 'Conteúdo não encontrado' });
  }

  let tabs = current.tabs;
  if (typeof rawContent === 'string') {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        tabs = parsed;
      }
    } catch (error) {
      tabs = [{ key: 'content', label: 'Conteúdo', text: [sanitizeInput(rawContent)], highlighted: [] }];
    }
  }

  current.title = title;
  current.tabs = tabs;
  await current.save();

  return res.json(serializeContent(current));
}

module.exports = {
  listSiteContent,
  updateSiteContent,
};
