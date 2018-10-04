/* eslint-disable no-use-before-define */

const mapValues = require('lodash/mapValues');
const url = require('url');

function getUrlParam(link, param) {
  const { query } = url.parse(link, true);

  return query[param];
}

function extractLink(link) {
  if (/fbcdn\.net\/safe_image\.php/.test(link)) {
    return getUrlParam(link, 'url');
  } if (/facebook\.com\/l.php/.test(link)) {
    return getUrlParam(link, 'u');
  }

  return link;
}

function attachmentMapper(value, key) {
  if (key === 'url') {
    return extractLink(value);
  }

  if (key === 'target') {
    return Object.assign({}, value, {
      url: extractLink(value.url),
    });
  }

  if (key === 'media') {
    return Object.assign({}, value, {
      image: Object.assign({}, value.image, { src: extractLink(value.image.src) }),
    });
  }

  if (key === 'subattachments') {
    return processAttachments(value);
  }

  return value;
}

function attachmentsMapper(attachment) {
  return mapValues(attachment, attachmentMapper);
}

function processAttachments(attachments) {
  const { data } = attachments;

  return Object.assign({}, attachments, {
    data: data.map(attachmentsMapper),
  });
}

function mediaMapper(value, key) {
  if (key === 'picture') {
    return extractLink(value);
  }

  if (key === 'attachments') {
    return processAttachments(value);
  }

  return value;
}

function processMedia(media) {
  return mapValues(media, mediaMapper);
}

module.exports = processMedia;
