const axios = require('axios');
const config = require('../config.json');
const fsp = require('fs-promise');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');

const url = config.url;
const db = config.db;
const email = config.email;
const emailPass = process.env.EMAIL_PW;
const subject = config.subject;

const readFile = (filename) => fsp.ensureFile(filename)
  .then(() => fsp.readFile(filename, {encoding:'utf8'}))
  .then(text => {
    try {
      return JSON.parse(text);
    } catch(e) {
      return [];
    }
  })
  .then(json => json || []);
const saveFile = (filename, json) => fsp.writeJson(filename, json);

const containsId = (list, id) => list.some(card => card.id === id);
const getAdditions = (old, current) => current.filter(card => !containsId(old, card.id));

const getTransporter = (email, pass) => Promise.promisifyAll(nodemailer.createTransport(`smtps://${encodeURIComponent(email)}:${encodeURIComponent(pass)}@smtp.gmail.com`));
const emailAdditions = (additions, email, pass, subject) => console.log(`sending mail to ${email}...`) || getTransporter(email, pass).sendMailAsync({
  from: email,
  to: email,
  subject: subject,
  text: JSON.stringify(additions, null, 4)
});

const dbFile = readFile(db);

axios
  .get(url)
  .then(response => response.data.cards)
  .then(cards => dbFile.then(previous => ({cards: cards, previous: previous})))
  .then(data => ({current: data.cards, additions: getAdditions(data.previous, data.cards)}))
  .then(data => {
    return saveFile(db, data.current).then(() => data.additions);
  })
  .then(additions => console.log('Additions found:', additions.length) || additions)
  .then(additions => additions.length > 0 ? emailAdditions(additions, email, emailPass, subject) : console.log('No additions, not sending email.'))
  .then(() => console.log('Done.'))

  .catch(err => {
    if (err && err.response && err.response.status) {
      console.log(`Error when fetching ${url}: status ${err.response.status}`);
    } else {
      console.log(`Unexpected error with URL ${url}: ${err}`);
      throw err;
    }
  });
