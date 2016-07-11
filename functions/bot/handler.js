'use strict';

var request = require('request')

// define hard-coded data
var phoneNumber = "0000-0000" // phone number of Elite Butler
var investorList = ["1", "2", "3", "4", "5", "6", "7", "1120359171369250"]; // messenger ids of registered clients

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {

    console.log('Event: ', display(event))
    const operation = event.operation
    const secret = event.secret
    const token = event.access_token 
    
    function sendTextMessage(id, text, resolve) {

        const messageData = {text: text};
        console.log('Ready to send text message', text);
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: {
                recipient: {
                    id: id
                },
                message: messageData
            }
        }, (error, response, body) => {
            console.log('GET response from ', response.request.body);
            if (error) {
                console.log('Error sending message: '+ error);
            } else if (response.body.error) {
                var json = JSON.parse(response.request.body)
                console.log('Error: '+ response.body.error);
            }
            resolve();
        })
    }

    function sendUrlMessage(id, url, title, resolve) {
        var messageData = {
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
                      title: "Open Web URL"
                    }, {
                      type: "postback",
                      title: "Call Postback",
                      payload: "Payload for first bubble"
                    }],
                  }]
                }
              }
            }
        }
        console.log('Ready to send url message');
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: token
            },
            method: 'POST',
            json: messageData
        }, (error, response, body) => {
            console.log('GET response from ', response);
            if (error) {
                console.log('Error sending message: '+ error);
            } else if (response.body.error) {
                var json = JSON.parse(response.request.body)
                if (json.recipient.id === "1120359171369250")
                    console.log(response)
                console.log('Error: '+ response.body.error);
            }
            resolve();
        })
    }



    switch (operation) {
        case 'verify':
            const verifyToken = event["verify_token"]
            if (secret === verifyToken) {
                context.succeed(parseInt(event["challenge"]));
            } else {
                context.fail(new Error('Unmatch'));
            }
            break
        case 'reply':
            const messagingEvents = event.body.entry[0].messaging;
            messagingEvents.forEach((messagingEvent) => {
                const sender = messagingEvent.sender.id;
                if (messagingEvent.message && messagingEvent.message.text) {
                    const text = messagingEvent.message.text;
                    console.log('In case reply', text);
                    var p = new Promise((resolve, reject)=> {
                        sendTextMessage(sender, text.substring(0, 200), resolve);
                    });
                    p.then(function(){
                        context.succeed();
                    });
                } else if (messagingEvent.postback) {
                    var event = messagingEvent;

                    var senderID = event.sender.id;
                    var recipientID = event.recipient.id;
                    var timeOfPostback = event.timestamp;

                    var payload = event.postback.payload;

                    console.log("Received postback for user %d and page %d with payload '%s' at %d", senderID, recipientID, payload, timeOfPostback);

                    // When a postback is called, we'll send a message back to the sender to 
                    // let them know it was successful
                    var p = new Promise((resolve, reject)=> {
                        sendTextMessage(senderID, "Postback called");
                    });
                    p.then(function(){
                        context.succeed();
                    });
                }
            })
            break
        case 'postEvent':

            var investor = event.body.id;
            // var textArray = event.body.report;
            var reportUrl = event.body.reportUrl;
            var title = event.body.title;

            //send messages one by one
            // var i = 0;
            // var canSend = true;
            // while (textArray.length > 0){
            //     if (canSend){
            //         var pSendText = new Promise((res, rej)=>{
            //             var text = textArray[0];
            //             sendTextMessage(investor, text, res);
            //             canSend = false;
            //         });
            //         pSendText.then(function(){
            //             canSend = true;
            //             textArray.shift();
            //         });
            //     }
            // }
            var message = "Dear Client,\n\nAttached please find the link for the latest market event report.\n\nIf you still find concerns, please contact "+phoneNumber;
            var p1 = new Promise((resolve, reject)=>{
                sendUrlMessage(investor, reportUrl, title, resolve)
            });
            var p2 = new Promise((resolve, reject)=>{
                sendTextMessage(investor, message, resolve);
            });
            Promise.all([p1, p2]).then(()=>{
                context.succeed();
            });

            // var marketEvent = event.body.report;
            // var generalReport = marketEvent.report;

            // var beginning = "A recent market event "+marketEvent.title+" is affecting the market to a great deal. Summarized effects:\n\n";
            // marketEvent.effects.forEach(function(effect){
            //     beginning += effect+"\n"
            // });
            // beginning += "\n"

            // var ending = "\n\nIf you still find concerns, please contact "+phoneNumber

            // var normalReport = "After reviewing your profile, you are not largely affected by this market event."+ending

            // // prepare an array of promises, because sending messages is async and need to wait for them all to complete
            // var promises = [];

            // var affectedInvestors = event.body.affectedInvestors;
            // investorList.forEach(function(investor){

            //     var p = new Promise((resolve, reject) => {
            //         var textArray = [];
            //         textArray.push(beginning);

            //         if (!(investor in affectedInvestors)) {
            //             textArray.push(normalReport);
            //         } else {
            //             var report = "This market event may affect you to a certain extent.\n\n";
            //             if (affectedInvestors[investor].positive.length != 0){
            //                 report += "The following companies you are engaged in are positively affected:\n\n";
            //                 affectedInvestors[investor].positive.forEach(function(company){
            //                     report += company+"\n";
            //                 });
            //             } 
                        
            //             textArray.push(report);

            //             report = "";
            //             if (affectedInvestors[investor].negative.length != 0){
            //                 report += "The following companies you are engaged in are negatively affected:\n\n";
            //                 affectedInvestors[investor].negative.forEach(function(company){
            //                     report += company+"\n";
            //                 });
            //             }
            //             report += "\nWe suggest that you take immediate response to better enhance your profile.";
                        
            //             textArray.push(report);
            //         }
            //         textArray.push(ending);

            //         // send text in pieces, one by one
            //         // var i = 0;
            //         // var canSend = true;
            //         // while (textArray.length > 0){
            //         //     if (canSend){
            //         //         var pSendText = new Promise((res, rej)=>{
            //         //             var text = textArray[0];
            //         //             sendTextMessage(investor, text, res);
            //         //             canSend = false;
            //         //         });
            //         //         pSendText.then(function(){
            //         //             canSend = true;
            //         //             textArray.shift();
            //         //         });
            //         //     }
            //         // }
            //         var report = textArray.join('\n');
            //         sendTextMessage(investor, report, resolve);
            //     });
            //     promises.push(p);
            // });
            // Promise.all(promises).then(()=>{
            //     context.succeed();
            // });
            //context.succeed()
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}
