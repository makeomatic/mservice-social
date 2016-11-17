module.exports = (userId) => ({
  internal: 'foo@bar.ru',
  network: 'instagram',
  network_id: userId,
  meta: JSON.stringify({
    id: userId,
    username: 'social-user',
    token: `${userId}.1a1a111.111aa111aaaa1111a1a111a1aa1111aa`,
  }),
});
