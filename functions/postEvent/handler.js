'use strict';

const request = require('request');
const aws = require('aws-sdk');
const db = require('../db.js');
aws.config.region = 'ap-northeast-1';
const s3 = new aws.S3();

// For proof of concept, the userData are hard-coded instead of retrieved from database.
// User ids for messaging are stored at the time they register with the FB fanpage.
const userData = {
    'companyInvestors': {
        'LVMH': [
            '1120359171369250',
            '958628190914977'
        ],
        'Scotch Whiskey': [
            '1120359171369250',
            '1208270852551586'
        ],
        'RyanAir': [
            '1120359171369250',
            '958628190914977'
        ],
        'Volkswagen Group': [
            '1120359171369250',
            '1208270852551586'
        ],
    },
}

module.exports.handler = function(event, context) {
    console.log(`Event: ${JSON.stringify(event)}`);
    const operation = event.operation;

    switch (operation) {
        case 'postEvent':
            console.log(`Payload: ${event.payload}`);

        	// parse payload
        	const pl = decodeURIComponent(event.payload);
            let str = pl.substring(8) // remove 'content='
            console.log(`Parsing payload to: ${str}`);
            str = str.replace(/\+/g, ' ');
            console.log(`Restore spaces: ${str}`);
            const json = JSON.parse(str);

            // look for affected users
            let affectedInvestorList = new Object();
            const data = json;

            const postiveComp = data.affectedIndustries.positive;
            postiveComp.forEach(function(company){
                const affectedInvestors = userData.companyInvestors[company];
                affectedInvestors.forEach(function(investor){
                    if (!(investor in affectedInvestorList)){
                        affectedInvestorList[investor] = {positive:[], negative:[]};
                        affectedInvestorList[investor].positive.push(company);
                    } else {
                        affectedInvestorList[investor].positive.push(company);
                    }
                });
                
            });
            const negativeComp = data.affectedIndustries.negative;
            negativeComp.forEach(function(company){
                const affectedInvestors = userData.companyInvestors[company];
                affectedInvestors.forEach(function(investor){
                    if (!(investor in affectedInvestorList)){
                        affectedInvestorList[investor] = {positive:[], negative:[]};
                        affectedInvestorList[investor].negative.push(company);
                    } else {
                        affectedInvestorList[investor].negative.push(company);
                    }
                });
            });

            // send individual messages one by one
            const marketEvent = json;

            let beginning = `A recent market event ${marketEvent.title} is affecting the market to a great deal. Summarized effects:\n\n`;
            marketEvent.effects.forEach(function(effect){
                beginning += effect+'\n';
            });
            beginning += '\n';

            const normalReport = 'After reviewing your profile, you are not largely affected by this market event.';

            // retrieve investor list
            const pi = new Promise ((res, rej) => {
                db.getInvestorList(res, rej);
            });
            pi.then((investorList) => {
                console.log(`investorList: ${JSON.stringify(investorList)}`);

                // prepare an array of promises, because sending messages is async and need to wait for them all to complete
                let promises = [];
                const affectedInvestors = affectedInvestorList;

                investorList.forEach(function(investor){
                    const p = new Promise((resolve, reject) => {
                        let textArray = [];
                        textArray.push(beginning);

                        if (!(investor in affectedInvestors)) {
                            textArray.push(normalReport);
                        } else {
                            let report = 'This market event may affect you to a certain extent.\n\n';
                            if (affectedInvestors[investor].positive.length != 0){
                                report += 'The following companies you are engaged in are positively affected:\n\n';
                                affectedInvestors[investor].positive.forEach(function(company){
                                    report += company+'\n';
                                });
                            } 
                            
                            textArray.push(report);

                            report = '';
                            if (affectedInvestors[investor].negative.length != 0){
                                report += 'The following companies you are engaged in are negatively affected:\n\n';
                                affectedInvestors[investor].negative.forEach(function(company){
                                    report += company+'\n';
                                });
                            }
                            report += '\nWe suggest that you take immediate response to better enhance your profile.';
                            
                            textArray.push(report);
                        }
                        const textStr = textArray.join('\n');

                        // upload report to s3
                        const params = {
                            Bucket: 'elite-butler-user-report',
                            Key: investor,
                            Body: textStr,
                        };
                        console.log(`Ready to send ${textStr}`);

                        s3.putObject(params, function(err, data) {
                            if (err) {
                                console.log(`Error uploading data: ${err}`);
                            } else {
                                console.log(`Successfully uploaded data to elite-butler-user-report/${investor}`);

                                const url = `https://elite-butler-user-report.s3-ap-northeast-1.amazonaws.com/${investor}`;
                                console.log(`The URL is ${url}`);
                                const payload = {
                                    id: investor,
                                    reportUrl: url,
                                    title: marketEvent.title,
                                }

                                request({
                                    url: 'https://bga829qa2d.execute-api.ap-northeast-1.amazonaws.com/dev/bot',
                                    method: 'POST',
                                    json: payload,
                                }, (error, response, body) => {
                                    if (error) {
                                        console.log(`Error sending msg to clients: ${error}`);
                                        reject();
                                    } else {
                                        console.log(`Successfully sent msg to clients: ${response}`);
                                        resolve();
                                    }
                                })
                            }
                        });
                    });
                    promises.push(p);
                });
                Promise.all(promises).then(()=>{
                    context.succeed('Thank you for your effort!');
                });
            });
            break
        default:
            context.fail(new Error(`Unrecognized operation ${operation}`));
    }
}