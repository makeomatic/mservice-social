module.exports = userId => ({
  meta: {
    code: 200,
  },
  data: {
    attribution: null,
    tags: [],
    type: 'image',
    location: {
      latitude: 11.111111111111,
      name: 'AAA AAA',
      longitude: -11.111111111111,
      id: 111111111,
    },
    comments: {
      count: 0,
    },
    filter: 'Normal',
    created_time: '1479312062',
    link: 'https://www.instagram.com/p/AA1AAAAaaaa/',
    likes: {
      count: 7,
    },
    images: {
      low_resolution: {
        url: 'https://scontent.cdninstagram.com/1.jpg',
        width: 320,
        height: 320,
      },
      thumbnail: {
        url: 'https://scontent.cdninstagram.com/1.jpg',
        width: 150,
        height: 150,
      },
      standard_resolution: {
        url: 'https://scontent.cdninstagram.com/1.jpg',
        width: 640,
        height: 640,
      },
    },
    users_in_photo: [
      {
        position: {
          y: 0.4826666666666667,
          x: 0.4106666666666667,
        },
        user: {
          username: 'social-user',
          profile_picture: 'https://scontent.cdninstagram.com/1.jpg',
          id: userId,
          full_name: 'Social User',
        },
      },
    ],
    caption: {
      created_time: '1479312062',
      text: 'Oh my text',
      from: {
        username: 'social-user',
        profile_picture: 'https://scontent.cdninstagram.com/1.jpg',
        id: userId,
        full_name: 'Social User',
      },
      id: '11111111111111111',
    },
    user_has_liked: false,
    id: `1111111111111111111_${userId}`,
    user: {
      username: 'social-user',
      profile_picture: 'https://scontent.cdninstagram.com/1.jpg',
      id: userId,
      full_name: 'Social User',
    },
  },
});
