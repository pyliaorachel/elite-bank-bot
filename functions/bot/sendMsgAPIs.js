'use strict';
const callSendAPI = require('./callSendAPI.js');

module.exports = {
	/*
   * Send a text message using the Send API.
   *
   */
  sendTextMessage: (recipientId, messageText, resolve) => {
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
  },
}
