'use strict';

var request = require('request')

// define hard-coded data
var phoneNumber = "(00)-0000-0000" // phone number of Elite Butler
var investorList = ["1", "2", "3", "4", "5", "6", "7", "1120359171369250"]; // messenger ids of registered clients

function display(object) {
    return JSON.stringify(object, null, 2)
}

module.exports.handler = function(event, context) {

    console.log('Event: ', display(event))
    const operation = event.operation
    const secret = event.secret
    const token = event.access_token 
    
    function sendTextMessage(sender, text, token) {
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
                    sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200), token)
                }
            })
            break
        case 'postEvent':

            var marketEvent = event.body.report;
            var generalReport = marketEvent.report;

            var beginning = "Dear Client of Elite Butler,\n\nWe would like to notify you that a recent market event "+marketEvent.title+" is affecting the market to a great deal. Summarized effects are as follows:\n\n";
            marketEvent.effects.forEach(function(effect){
                beginning += effect+"\n"
            });
            beginning += "\n"

            var ending = "\n\nIf you still find concerns, please contact "+phoneNumber+".\n\nRegards,\nElite Butler"

            var normalReport = beginning + "Fortunately, after reviewing your profile, you are not largely affected by this market event." + ending

            var affectedInvestors = event.body.affectedInvestors;
            investorList.forEach(function(investor){
                var report = "";
                if (!(investor in affectedInvestors)) {
                    report = normalReport;
                } else {
                    report = beginning + "After reviewing you profile, we found that this market event may affect you to a certain extent.\n\n";
                    if (affectedInvestors[investor].positive.length != 0){
                        report += "The following companies you are engaged in are positively affected by this market event:\n\n";
                        affectedInvestors[investor].positive.forEach(function(company){
                            report += company+"\n";
                        });
                    } 
                    report += "\n";
                    if (affectedInvestors[investor].negative.length != 0){
                        report += "The following companies you are engaged in are negatively affected by this market event:\n\n";
                        affectedInvestors[investor].negative.forEach(function(company){
                            report += company+"\n";
                        });
                    }
                    report += "\n\nWe suggest that you take immediate response to better enhance your profile.";
                    report += ending;
                }
                console.log("Report for investor #"+investor+": "+report);
            });
            context.succeed()
            break
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'))
    }

}
