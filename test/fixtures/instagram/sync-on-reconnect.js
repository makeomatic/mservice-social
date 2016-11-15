const Promise = require('bluebird');

module.exports = {
  request: {
    url: 'https://api.instagram.com/v1/users/555/media/recent?access_token=555.1&count=200',
    json: true,
  },
  response: Promise.resolve({
    pagination: {
      next_url: 'https://api.instagram.com/v1/users/555/media/recent?access_token=555.1&' +
        'count=200&max_id=1385552885716996590_555',
      next_max_id: '1385552885716996590_555',
    },
    meta: {
      code: 200,
    },
    data: [
      {
        attribution: null,
        tags: [],
        type: 'image',
        location: null,
        comments: {
          count: 0,
        },
        filter: 'Gingham',
        created_time: 1479166683,
        link: 'https://www.instagram.com/p/BMzyyiWg/',
        likes: {
          count: 0,
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
        users_in_photo: [],
        caption: null,
        user_has_liked: false,
        id: '1385552885716996591_555',
        user: {
          username: 'perchik',
          profile_picture: 'https://scontent.cdninstagram.com/1.jpg',
          id: 555,
          full_name: 'Perchik The Cat',
        },
      },
      {
        attribution: null,
        tags: [],
        type: 'image',
        location: null,
        comments: {
          count: 0,
        },
        filter: 'Gingham',
        created_time: 1479166683,
        link: 'https://www.instagram.com/p/BMzyyiWg/',
        likes: {
          count: 0,
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
        users_in_photo: [],
        caption: null,
        user_has_liked: false,
        id: '1385552885716996590_555',
        user: {
          username: 'perchik',
          profile_picture: 'https://scontent.cdninstagram.com/1.jpg',
          id: 555,
          full_name: 'Perchik The Cat',
        },
      },
    ],
  }),
};
