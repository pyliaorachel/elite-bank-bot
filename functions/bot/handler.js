'use strict';

const request = require('request');
const sendMsgAPIs = require('./sendMsgAPIs.js');
const utils = require('./utils.js');
const db = require('../db.js');

// define hard-coded data
var phoneNumber = "0000-0000" // phone number of Elite Butler

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {

    console.log('Event: ', display(event))
    const operation = event.operation
    const secret = event.secret
    const token = event.access_token 

    switch (operation) {
        case 'verify':
            const verifyToken = event["verify_token"];
            if (secret === verifyToken) {
                context.succeed(parseInt(event["challenge"]));
            } else {
                context.fail(new Error('Unmatch'));
            }
            break;
        case 'reply':
            const messagingEvents = event.body.entry[0].messaging;
            messagingEvents.forEach((messagingEvent) => {
                const sender = messagingEvent.sender.id;
                if (messagingEvent.message && messagingEvent.message.text) {
                    var pQandA = new Promise((res, rej) => {
                        console.log('Ready to process Q&A');
                        utils.processQAndA(messagingEvent.message.text, res);
                    });
                    pQandA.then((items) => {
                        console.log('Items: ', items);

                        var p = new Promise((resolve, reject)=> {
                            if (items.length === 0) {
                                console.log('No suggested questions.');
                                const text = 'Sorry, we cannot find a corresponding answer to your question. Try to make the keywords clearer, or contact (00)-0000-0000 for help.';
                                sendMsgAPIs.sendTextMessage(sender, text, resolve);
                            } else {
                                console.log('Found suggested questions.');
                                sendMsgAPIs.sendGenericMessage(sender, items, resolve);
                            }
                        });
                        p.then(() => {
                            console.log('Promise complete in replying suggested questions');
                            context.succeed();
                        });
                    });
                    
                } else if (messagingEvent.postback) {
                    var event = messagingEvent;

                    var senderID = event.sender.id;
                    var recipientID = event.recipient.id;
                    var timeOfPostback = event.timestamp;

                    var payload = event.postback.payload;

                    console.log("Received postback for user %d and page %d with payload '%s' at %d", senderID, recipientID, payload, timeOfPostback);

                    switch (payload) {
                        case 'PAYLOAD_GET_STARTED':
                            db.setUser(senderID);
                            const text = 'Welcome to Elite Butler! You may ask any questions here. We will post to you the latest market news from time to time :D'
                            
                            var p = new Promise((resolve, reject) => {
                                sendMsgAPIs.sendTextMessage(senderID, text, resolve);
                            });
                            p.then(() => {
                                console.log('Promise complete in PAYLOAD_GET_STARTED');
                                context.succeed();
                            });
                            break;
                        default:
                            const key = payload.substring(9, 17);
                            if (key === 'QUESTION') {
                                const id = payload.substring(18);
                                console.log(`Postback called for question ${id}`);
                                var p = new Promise((resolve, reject) => {
                                    sendMsgAPIs.sendAnswer(senderID, id, resolve);
                                });
                                p.then(() => {
                                    console.log('Promise complete in postback');
                                    context.succeed();
                                });
                            }
                    }
                } else if (messagingEvent.account_linking){
                    console.log(messagingEvent);
                    
                    context.succeed();
                }
            })
            break;
        case 'postEvent':

            var investor = event.body.id;
            var reportUrl = event.body.reportUrl;
            var title = event.body.title;

            var message = "Dear Client,\n\nAttached please find the link for the latest market event report.\n\nIf you still find concerns, please contact "+phoneNumber;
            var p1 = new Promise((resolve, reject)=>{
                sendMsgAPIs.sendUrlMessage(investor, reportUrl, title, resolve)
            });
            var p2 = new Promise((resolve, reject)=>{
                sendMsgAPIs.sendTextMessage(investor, message, resolve);
            });
            Promise.all([p1, p2]).then(()=>{
                context.succeed();
            });
            break;
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}
