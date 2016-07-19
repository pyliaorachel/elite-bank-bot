'use strict';
const callSendAPI = require('./callSendAPI.js');
const db = require('../db.js');

function sendTextMessage(recipientId, messageText, resolve) {
  console.log('In sendTextMessage');
  const messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
  };
  callSendAPI(messageData, resolve);
}

function sendUrlMessage(id, url, title, resolve) {
  console.log('In sendUrlMessage');
  const messageData = {
      recipient: {
        id: id
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [{
              title: title,
              subtitle: new Date(),
              item_url: url,               
              image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/UBS_Logo.svg/1280px-UBS_Logo.svg.png",
              buttons: [{
                type: "web_url",
                url: url,
                title: "Open Report Link",
              }, {
                type: "web_url",
                url: "https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/authentication",
                title: "Make Transaction",
              }]
            }]
          }
        }
      }
  }
  console.log('Ready to send url message');
  callSendAPI(messageData, resolve);
}

function sendGenericMessage(recipientId, items, resolve) {
  console.log('In sendGenericMessage');
  const messageData = {
      recipient: {
          id: recipientId
      },
      message: {
          attachment: {
              type: 'template',
              payload: {
                  template_type: 'generic',
                  elements: items
              }
          }
      }
  };
  callSendAPI(messageData, resolve);
}

function sendAnswer(recipientId, answerID, resolve) {
  console.log('In sendAnswer');
  const pa = new Promise ((res, rej) => {
      db.getAnswer(answerID, res, rej);
  });
  pa.then((answer) => {
      console.log(`Answer for ${answerID}: ${answer}`);

      var pt = new Promise ((resolve, reject) => {
          db.getTemplate(answerID, resolve, reject);
      });
      pt.then((template) => {
          console.log(`Template: ${JSON.stringify(template)}`);

          const type = template.type;
          switch (type) {
              case 'text':
                  console.log('In text');
                  var p = new Promise((res, rej)=> {
                      sendTextMessage(recipientId, answer, res);
                  });
                  p.then(function(){
                      resolve();
                  });
                  break;
              case 'web_url':
                  console.log('In web_url');
                  const title = template.title;
                  const url = template.url;

                  let buttons = [];
                  for (let i = 0; i < title.length; i++) {
                      buttons.push({
                          type: 'web_url',
                          url: url[i],
                          title: title[i]
                      });
                  }
                  buttons.forEach((button) => {
                      console.log(`Button: ${JSON.stringify(button)}`);
                  });

                  const items = [
                      {
                          title: 'Links',
                          buttons: buttons
                      }
                  ];
                  console.log(`items: ${JSON.stringify(items)}`);

                  const messageData = {
                      recipient: {
                         id: recipientId
                      },
                      message: {
                          attachment: {
                              type: 'template',
                              payload: {
                                  template_type: 'generic',
                                  elements: items
                              }
                          }
                      }
                  };

                  var p2 = new Promise((res, rej)=> {
                      console.log('Send text message');
                      sendTextMessage(recipientId, answer, res);
                  });
                  var p3 = new Promise ((res, rej)=> {
                      console.log('Send links');
                      // send links
                      callSendAPI(messageData, res);
                  });
                  Promise.all([p2, p3]).then(() => {
                      console.log('Promise complete for web_url');
                      resolve();
                  });
                  break;      
          }
      });
  });
}

module.exports = {
  sendTextMessage,
  sendGenericMessage,
  sendUrlMessage,
  sendAnswer,
}
