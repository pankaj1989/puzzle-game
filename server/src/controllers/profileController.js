async function getProfile(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const { displayName } = req.body;
  if (displayName !== undefined) req.user.displayName = displayName;
  await req.user.save();
  res.json({ user: req.user });
}

module.exports = { getProfile, updateProfile };
