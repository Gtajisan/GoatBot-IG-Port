'use strict';

const login = require('./src/login');
const utils = require('./utils');

function instagramFCA(credentials, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = Object.assign({
    autoReconnect: true,
    randomUserAgent: true,
    autoMarkRead: false,
    selfListen: false,
    emitReady: true,
    listenTimeout: 60000,
    updatePresence: false,
    forceLogin: false,
    logLevel: 'info'
  }, options);

  const loginPromise = login(credentials, options);

  if (callback) {
    loginPromise
      .then(api => callback(null, api))
      .catch(err => callback(err));
    return;
  }

  return loginPromise;
}

module.exports = instagramFCA;
module.exports.login = instagramFCA;
module.exports.utils = utils;
module.exports.version = require('./package.json').version;
