function slugifyName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(name, excludeId, CategoryModel) {
  const base = slugifyName(name) || 'category';
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await CategoryModel.exists(query);
    if (!exists) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

module.exports = { slugifyName, ensureUniqueSlug };
