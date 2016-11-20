module.exports = userId => ({
  internal: 'foo@bar.ru',
  network: 'instagram',
  network_id: userId,
  meta: JSON.stringify({
    account_id: userId,
    account: 'social-user',
    access_token: `${userId}.1a1a111.111aa111aaaa1111a1a111a1aa1111aa`,
  }),
});
