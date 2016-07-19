'use strict';

const request = require('request');
const sendMsgAPIs = require('./sendMsgAPIs.js');
const utils = require('./utils.js');
const db = require('../db.js');

// define hard-coded data
const phoneNumber = '0000-0000' // phone number of Elite Butler

module.exports.handler = function(event, context) {

    console.log(`Event: ${JSON.stringify(event)}`);
    const operation = event.operation;
    const secret = event.secret;
    const token = event.access_token;

    switch (operation) {
        case 'verify':
            const verifyToken = event['verify_token'];
            if (secret === verifyToken) {
                context.succeed(parseInt(event['challenge']));
            } else {
                context.fail(new Error('Unmatch'));
            }
            break;
        case 'reply':
            const messagingEvents = event.body.entry[0].messaging;
            messagingEvents.forEach((messagingEvent) => {
                const sender = messagingEvent.sender.id;
                if (messagingEvent.message && messagingEvent.message.text) {
                    const pQandA = new Promise((res, rej) => {
                        console.log('Ready to process Q&A');
                        utils.processQAndA(messagingEvent.message.text, res);
                    });
                    pQandA.then((items) => {
                        console.log(`Items: ${items}`);

                        const p = new Promise((resolve, reject)=> {
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
                    const event = messagingEvent;

                    const senderID = event.sender.id;
                    const recipientID = event.recipient.id;
                    const timeOfPostback = event.timestamp;

                    const payload = event.postback.payload;

                    console.log('Received postback for user %d and page %d with payload %s at %d', senderID, recipientID, payload, timeOfPostback);

                    switch (payload) {
                        case 'PAYLOAD_GET_STARTED':
                            db.setUser(senderID);
                            const text = 'Welcome to Elite Butler! You may ask any questions here. We will post to you the latest market news from time to time :D'
                            
                            const pStart = new Promise((resolve, reject) => {
                                sendMsgAPIs.sendTextMessage(senderID, text, resolve);
                            });
                            pStart.then(() => {
                                console.log('Promise complete in PAYLOAD_GET_STARTED');
                                context.succeed();
                            });
                            break;
                        default:
                            const key = payload.substring(9, 17);
                            if (key === 'QUESTION') {
                                const id = payload.substring(18);
                                console.log(`Postback called for question ${id}`);
                                const pAns = new Promise((resolve, reject) => {
                                    sendMsgAPIs.sendAnswer(senderID, id, resolve);
                                });
                                pAns.then(() => {
                                    console.log('Promise complete in postback');
                                    context.succeed();
                                });
                            }
                    }
                } else if (messagingEvent.account_linking){
                    console.log(`Account linking: ${messagingEvent}`);
                    context.succeed();
                }
            })
            break;
        case 'postEvent':
            const investor = event.body.id;
            const reportUrl = event.body.reportUrl;
            const title = event.body.title;

            const message = `Dear Client,\n\nAttached please find the link for the latest market event report.\n\nIf you still find concerns, please contact ${phoneNumber}`;
            const pPost1 = new Promise((resolve, reject)=>{
                sendMsgAPIs.sendUrlMessage(investor, reportUrl, title, resolve);
            });
            const pPost2 = new Promise((resolve, reject)=>{
                sendMsgAPIs.sendTextMessage(investor, message, resolve);
            });
            Promise.all([pPost1, pPost2]).then(()=>{
                context.succeed();
            });
            break;
        default:
            context.fail(new Error(`Unrecognized operation ${operation}`));
    }

}
