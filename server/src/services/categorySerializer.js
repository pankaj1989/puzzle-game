function buildPublicUrl(req, imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

function serializeCategory(req, category) {
  return {
    _id: category._id,
    name: category.name,
    image: buildPublicUrl(req, category.image || null),
    isPremium: Boolean(category.isPremium),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function toStoredImagePath(file) {
  if (!file?.filename) return null;
  return `categories/${file.filename}`;
}

module.exports = {
  serializeCategory,
  toStoredImagePath,
};