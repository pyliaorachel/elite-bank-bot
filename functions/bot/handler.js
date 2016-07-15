'use strict';

var request = require('request');
var sendMsgAPIs = require('./sendMsgAPIs.js');

// define hard-coded data
var phoneNumber = "0000-0000" // phone number of Elite Butler
var investorList = ["1", "2", "3", "4", "5", "6", "7", "1120359171369250"]; // messenger ids of registered clients
var data = {
    questions: {
        "1": "Where can I obtain information on UBS's latest financial results?",
        "2": "Where is the UBS share listed?",
        "3": "What is UBS's fiscal year?",
        "4": "Where are UBS's headquarters?",
        "5": "What are the dates of previous and future AGM's?",
        "6": "When will the next annual and quarterly results be published?"
    },
    answers: {
        "1": "UBS publishes its results quarterly in February, May, August and November. The annual report is published in March.",
        "2": "The UBS GRS is listed on the SIX Swiss Exchange and the New York Stock Exchange.",
        "3": "UBS's fiscal year is 1st January to 31st December.",
        "4": "UBS is headquartered in Zurich and Basel, Switzerland.",
        "5": "Information on UBS's annual general meetings (AGMs) is shown in our AGM section. AGM's are normally held in April in Switzerland (Zurich or Basel).",
        "6": "UBS normally publishes its quarterly results in February, May, August and November. UBS's annual report is published in March."
    },
    keys: {
        "financial": [1],
        "share": [2],
        "fiscal year": [3],
        "headquarters": [4],
        "AGM": [5],
        "results": [1, 6],
        "report": [1, 6],
        "GRS": [2],
        "annual": [1, 6],
        "quarterly": [1, 6],
        "where": [1, 2, 4],
        "what": [3, 5], 
        "when": [6]
    },
    template: {
        "1": {
            type:"web_url", 
            title: ["Annual reporting", "Quarterly reporting"], 
            url: [
            "https://www.ubs.com/global/en/about_ubs/investor_relations/annualreporting/2015.html", 
            "https://www.ubs.com/global/en/about_ubs/investor_relations/quarterly_reporting/2016.html"]
        },
        "2": {type:"text"},
        "3": {type:"text"},
        "4": {type:"text"},
        "5": {
            type:"web_url", 
            title: ["Annual general meeting"], 
            url: ["https://www.ubs.com/global/en/about_ubs/investor_relations/agm.html"]},
        "6": {
            type:"web_url", 
            title: ["Corporate calendar"],
            url: ["https://www.ubs.com/global/en/about_ubs/investor_relations/ubs_events.html"]
        }
    }
};

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
                      title: "Open Report Link"
                    }, {
                      type: "account_link",
                      url: "https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/authentication"
                    }]
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

    function processQAndA(question){
        const keywords = question.toLowerCase().trim().split(' ');
        console.log(keywords);

        const keywordData = data.keys;
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
            return [];
        } else {
            let toSort = [];
            Object.keys(result).forEach(function(id){
                toSort.push([id, result[id]]);
            });
            toSort.sort(function(a, b){
                return b[1] - a[1];
            });
            toSort = toSort.slice(0, 3); // top 3
            console.log(`toSort: ${toSort}`);

            const questionData = data.questions;
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

            return(items); // array of array [id, question]
        }
    }

    function sendAnswer(recipientId, answerID, resolve) {
        const answer = data.answers[answerID];
        console.log(`Answer for ${answerID}: ${answer}`);

        const template = data.template[answerID];
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
                    sendMsgAPIs.sendTextMessage(recipientId, answer, res);
                });
                var p3 = new Promise ((res, rej)=> {
                    console.log('Send links');
                    // send links
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
                            console.log('Error: '+ response.body.error);
                        }
                        res();
                    });
                });
                Promise.all([p2, p3]).then(() => {
                    console.log('Promise complete for web_url');
                    resolve();
                });
                break;      
            }
        }

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
                    const items = processQAndA(messagingEvent.message.text);
                    console.log('Items: ', items);

                    var p = new Promise((resolve, reject)=> {
                        if (items.length === 0) {
                            console.log('No suggested questions.');
                            const text = 'Sorry, we cannot find a corresponding answer to your question. Try to make the keywords clearer, or contact (00)-0000-0000 for help.';
                            sendMsgAPIs.sendTextMessage(sender, text, resolve);
                        } else {
                            console.log('Found suggested questions.');
                            sendGenericMessage(sender, items, resolve);
                        }
                    });
                    p.then(() => {
                        console.log('Promise complete in replying suggested questions');
                        context.succeed();
                    });
                } else if (messagingEvent.postback) {
                    var event = messagingEvent;

                    var senderID = event.sender.id;
                    var recipientID = event.recipient.id;
                    var timeOfPostback = event.timestamp;

                    var payload = event.postback.payload;

                    console.log("Received postback for user %d and page %d with payload '%s' at %d", senderID, recipientID, payload, timeOfPostback);

                    switch (payload) {
                        default:
                            const key = payload.substring(9, 17);
                            if (key === 'QUESTION') {
                                const id = payload.substring(18);
                                console.log(`Postback called for question ${id}`);
                                var p = new Promise((resolve, reject) => {
                                    sendAnswer(senderID, id, resolve);
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
            break;
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}
