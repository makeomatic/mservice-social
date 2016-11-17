module.exports = userId => ({
  changed_aspect: 'media',
  object: 'user',
  object_id: userId,
  time: 1479312064,
  subscription_id: 0,
  data: {
    media_id: `1234567890123456789_${userId}`,
  },
});
