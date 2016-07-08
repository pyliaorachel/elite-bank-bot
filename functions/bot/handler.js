'use strict';

var request = require('request')

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {

    console.log('Event: ', display(event))
    const operation = event.operation
    const secret = event.secret
    const token = event.access_token 
    
    function sendTextMessage(sender, text) {
        const messageData = {text: text}
        console.log('Ready to send text message', text);
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: sender
                },
                message: messageData
            }
        }, (error, response, body) => {
            console.log('GET response', response);
            context.succeed(response);
            if (error) {
                context.fail('Error sending message: ', error);
            } else if (response.body.error) {
                context.fail('Error: ', response.body.error);
            }
        })
    }

    switch (operation) {
        case 'verify':
            const verifyToken = event["verify_token"]
            if (secret === verifyToken) {
                context.succeed(parseInt(event["challenge"]))
            } else {
                context.fail(new Error('Unmatch'))
            }
            break
        case 'reply':
            const messagingEvents = event.body.entry[0].messaging
            messagingEvents.forEach((messagingEvent) => {
                const sender = messagingEvent.sender.id
                if (messagingEvent.message && messagingEvent.message.text) {
                    const text = messagingEvent.message.text
                    console.log('In case reply', text);
                    sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200))
                }
            })
            break
        case 'postEvent':
            console.log(event)
            //context.succeed()
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}
