const request = require('request');

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

module.exports = (messageData, resolve) => {
  console.log(`Ready to send message: ${JSON.stringify(messageData)}`);
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData,
  }, (error, response, body) => {
    console.log('callSendAPI response: ');
    console.log(response.statusCode);
    if (!error && response.statusCode === 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;
      console.log(`Successfully sent generic message with id ${messageId} 
      to recipient ${recipientId}`);
      resolve();
    } else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
};

