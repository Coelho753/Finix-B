const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    tabs: [{
      key: String,
      label: String,
      highlighted: [{ type: String }],
      text: [{ type: String }],
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PageContent', pageContentSchema);
