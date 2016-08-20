'use strict';

var axios = require('axios');
var config = require('../config.json');
var fsp = require('fs-promise');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');

var url = config.url;
var db = config.db;
var email = config.email;
var emailPass = process.env.EMAIL_PW;
var subject = config.subject;

var readFile = function readFile(filename) {
  return fsp.ensureFile(filename).then(function () {
    return fsp.readFile(filename, { encoding: 'utf8' });
  }).then(function (text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  }).then(function (json) {
    return json || [];
  });
};
var saveFile = function saveFile(filename, json) {
  return fsp.writeJson(filename, json);
};

var containsId = function containsId(list, id) {
  return list.some(function (card) {
    return card.id === id;
  });
};
var getAdditions = function getAdditions(old, current) {
  return current.filter(function (card) {
    return !containsId(old, card.id);
  });
};

var getTransporter = function getTransporter(email, pass) {
  return Promise.promisifyAll(nodemailer.createTransport('smtps://' + encodeURIComponent(email) + ':' + encodeURIComponent(pass) + '@smtp.gmail.com'));
};
var emailAdditions = function emailAdditions(additions, email, pass, subject) {
  return console.log('sending mail to ' + email + '...') || getTransporter(email, pass).sendMailAsync({
    from: email,
    to: email,
    subject: subject,
    text: JSON.stringify(additions, null, 4)
  });
};

var dbFile = readFile(db);

axios.get(url).then(function (response) {
  return response.data.cards;
}).then(function (cards) {
  return dbFile.then(function (previous) {
    return { cards: cards, previous: previous };
  });
}).then(function (data) {
  return { current: data.cards, additions: getAdditions(data.previous, data.cards) };
}).then(function (data) {
  return saveFile(db, data.current).then(function () {
    return data.additions;
  });
}).then(function (additions) {
  return console.log('Additions found:', additions.length) || additions;
}).then(function (additions) {
  return additions.length > 0 ? emailAdditions(additions, email, emailPass, subject) : console.log('No additions, not sending email.');
}).then(function () {
  return console.log('Done.');
}).catch(function (err) {
  if (err && err.response && err.response.status) {
    console.log('Error when fetching ' + url + ': status ' + err.response.status);
  } else {
    console.log('Unexpected error with URL ' + url + ': ' + err);
    throw err;
  }
});