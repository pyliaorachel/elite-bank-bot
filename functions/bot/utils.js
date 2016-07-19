'use strict';
const sendMsgAPIs = require('./sendMsgAPIs.js');
const callSendAPI = require('./callSendAPI.js');
const db = require('../db.js');

function processQAndA(question, res){
  const keywords = question.toLowerCase().trim().split(' ');
  console.log(keywords);

  var pk = new Promise ((resolve, reject) => {
      db.getKeys(resolve, reject);
  });
  pk.then((keywordData) => {
      console.log(`keywordData: ${JSON.stringify(keywordData)}`);

      let result = {};

      keywords.forEach(function(keyword){
          const match = keywordData[keyword];
          if (match !== undefined){
              match.forEach(function(id){
                  if (result[id] === undefined) {
                      result[id] = 1;
                  } else {
                      result[id]++;
                  }
              });
          }
      });
      console.log(`result: ${JSON.stringify(result)}`);

      if (Object.keys(result).length === 0) {
          console.log('no matching keyword');
          res([]);
      } else {
          console.log('matching keyword');
          let toSort = [];
          Object.keys(result).forEach(function(id){
              toSort.push([id, result[id]]);
          });
          toSort.sort(function(a, b){
              return b[1] - a[1];
          });
          toSort = toSort.slice(0, 3); // top 3
          console.log(`toSort: ${toSort}`);

          var pq = new Promise ((resolve, reject) => {
              db.getQuestions(resolve, reject);
          });
          pq.then((questionData) => {
              console.log(`questionData: ${JSON.stringify(questionData)}`);
              //const questionData = data.questions;
              let suggestedQuestions = [];
              toSort.forEach(function(pair){
              const id = pair[0];
              const question = questionData[id];
                  suggestedQuestions.push([id, question]);
              });
              console.log(`suggestedQuestions: ${suggestedQuestions}`);

              let items = [];
              suggestedQuestions.forEach(function(pair){
                  const item = {
                      title: 'Do you mean:',
                      subtitle: pair[1],
                      buttons: [{
                          type: 'postback',
                          title: 'Yes',
                          payload: 'POSTBACK_QUESTION_'+pair[0]
                      }]
                  };
                  items.push(item);
              });
              items.push({
                  title: 'Problems finding the right question?',
                  buttons: [{
                      type: 'web_url',
                      title: 'Find Help',
                      url: 'https://www.ubs.com/global/en/contact/contactus.html'
                  }]
              });
              items.forEach(function(item){
                  console.log(`item: ${JSON.stringify(item)}`);
              });

              res(items); // array of array [id, question]
              
          });
      }
  });
}

module.exports = {
  processQAndA,
}

