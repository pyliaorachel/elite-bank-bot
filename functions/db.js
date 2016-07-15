'use strict';
const firebase = require('firebase');

firebase.initializeApp({
  databaseURL: 'https://elite-butler-q-and-a.firebaseio.com',
});

const db = firebase.database();
const ref = db.ref('/');
const refQuestions = db.ref('/questions');
const refAnswers = db.ref('/answers');
const refTemplates = db.ref('/templates');
const refKeys = db.ref('/keys');
const refInvestorList = db.ref('/investorList');

const getData = (res, rej) => {
  console.log('In getData');
  ref.once('value', (snapshot) => {
    console.log('callback of getData');
    const data = snapshot.val();
    console.log(`data: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getUsers: ${error}`);
    rej();
  });
};

const getQuestions = (res, rej) => {
  console.log('In getQuestions');
  refQuestions.once('value', (snapshot) => {
    console.log('callback of getQuestions');
    const data = snapshot.val();
    console.log(`questions: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getQuestions: ${error}`);
    rej();
  });
};

const getAnswers = (res, rej) => {
  console.log('In getAnswers');
  refAnswers.once('value', (snapshot) => {
    console.log('callback of getAnswers');
    const data = snapshot.val();
    console.log(`answers: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getAnswers: ${error}`);
    rej();
  });
};

const getAnswer = (answerID, res, rej) => {
  console.log('In getAnswer');
  refAnswers.child(answerID).once('value', (snapshot) => {
    console.log('callback of getAnswer');
    const data = snapshot.val();
    console.log(`answer: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getAnswer: ${error}`);
    rej();
  });
};

const getTemplates = (res, rej) => {
  console.log('In getTemplates');
  refTemplates.once('value', (snapshot) => {
    console.log('callback of getTemplates');
    const data = snapshot.val();
    console.log(`templates: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getTemplates: ${error}`);
    rej();
  });
};
const getTemplate = (id, res, rej) => {
  console.log('In getTemplate');
  refTemplates.child(id).once('value', (snapshot) => {
    console.log('callback of getTemplate');
    const data = snapshot.val();
    console.log(`template ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getTemplate: ${error}`);
    rej();
  });
};

const getKeys = (res, rej) => {
  console.log('In getKeys');
  refKeys.once('value', (snapshot) => {
    console.log('callback of getKeys');
    const data = snapshot.val();
    console.log(`keys: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getKeys: ${error}`);
    rej();
  });
};

const getInvestorList = (res, rej) => {
  console.log('In getInvestorList');
  refInvestorList.once('value', (snapshot) => {
    console.log('callback of getInvestorList');
    const data = snapshot.val();
    console.log(`InvestorList: ${JSON.stringify(data)}`);
    res(data);
  }, (error) => {
    console.log(`Error in getInvestorList: ${error}`);
    rej();
  });
};

module.exports = {
  getData,
  getQuestions,
  getAnswers,
  getAnswer,
  getTemplates,
  getTemplate,
  getKeys,
  getInvestorList,
};
