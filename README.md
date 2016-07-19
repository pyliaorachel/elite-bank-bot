![Elite Butler](https://scontent-hkg3-1.xx.fbcdn.net/v/t1.0-9/13754572_1217239028320861_8226631216549967950_n.jpg?oh=b6e018d62f29c231d0747e74f82d34cd&oe=57EC34FD)

A proof of concept for the Elite Bank BOT - Elite Butler

## Language & Environment

Product based on __Facebook Messenger Platform__ and webhook to our BOT server.

Serverside implementation written in __Node.js__ & deployed in [AWS Lambda](https://aws.amazon.com/lambda/) using [serverless](https://github.com/serverless/serverless) framework.

Database using Google [Firebase](https://www.firebase.com).

**Depending on the budget, performance requirement, data size, and project size, it is recommended to adopt a suitable environment for your project.*

## Function description
### functions/bot
The BOT server for interacting with the users. New users can click on the "Get Started" button to register, and the user ID will be saved into the database.
### functions/postEvent
Linked from a report forming page to be used by the market event analyst. When the report of market event is sent, a customized report would be uploaded up to AWS S3 and a link to it along with messages would be presented to the user.

**The report forming page is the index.html file at root.*
### functions/authentication
After the market event report is presented to user, a button can be pressed if the user wishes to perform action. It will link to this authentication page. 

**The page is the index.html file at functions/authentication*

<img src="https://scontent-hkg3-1.xx.fbcdn.net/t31.0-8/13691001_1217575908287173_4051419229606407373_o.jpg" 
alt="Authentication Page" width="330" height="200" border="50" />

### functions/transaction
If authentication passes, the user will be redirected to the transaction page to perform transaction. Here we simplify a bank transaction system by only presenting a single button as for proof of concept. The real system should be more complicated.

**The page is the index.html file at functions/transaction*

<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t1.0-9/13709953_1217575941620503_7497970868726730283_n.jpg?oh=afacefced5cfd2d25e47290ff496fb3b&oe=582F69F7" 
alt="Transaction Page" width="450" height="200" border="50" />

## Database description
The database is based on Firebase in our proof of concept. The choice of database should be suitable for your own dataset and implementation.

The data will be retrieved in JSON format:
```
{
  "answers": {
    "111": "UBS publishes its results quarterly in February, May, August and November. The annual report is published in March.",
    "222": "The UBS GRS is listed on the SIX Swiss Exchange and the New York Stock Exchange.",
    "333": "UBS's fiscal year is 1st January to 31st December.",
    "444": "UBS is headquartered in Zurich and Basel, Switzerland.",
    "555": "Information on UBS's annual general meetings (AGMs) is shown in our AGM section. AGM's are normally held in April in Switzerland (Zurich or Basel).",
    "666": "UBS normally publishes its quarterly results in February, May, August and November. UBS's annual report is published in March."
  },
  "investorList": {
    "-KMjE0-EGUYqJhOzDiZv": "1120359171369250",
    "erqerew": "958628190914977",
    "erqrwert346": "1120359171369250"
  },
  "keys": {
    "agm": [
      555
    ],
    "annual": [
      111,
      666
    ],
    "financial": [
      111
    ],
    "fiscal year": [
      333
    ],
    "grs": [
      222
    ],
    "headquarters": [
      444
    ],
    "quarterly": [
      111,
      666
    ],
    "report": [
      111,
      666
    ],
    "results": [
      111,
      666
    ],
    "share": [
      222
    ],
    "what": [
      333,
      555
    ],
    "when": [
      666
    ],
    "where": [
      111,
      222,
      444
    ]
  },
  "questions": {
    "111": "Where can I obtain information on UBS's latest financial results?",
    "222": "Where is the UBS share listed?",
    "333": "What is UBS's fiscal year?",
    "444": "Where are UBS's headquarters?",
    "555": "What are the dates of previous and future AGM's?",
    "666": "When will the next annual and quarterly results be published?"
  },
  "templates": {
    "111": {
      "title": [
        "Annual reporting",
        "Quarterly reporting"
      ],
      "type": "web_url",
      "url": [
        "https://www.ubs.com/global/en/about_ubs/investor_relations/annualreporting/2015.html",
        "https://www.ubs.com/global/en/about_ubs/investor_relations/quarterly_reporting/2016.html"
      ]
    },
    "222": {
      "type": "text"
    },
    "333": {
      "type": "text"
    },
    "444": {
      "type": "text"
    },
    "555": {
      "title": [
        "Annual general meeting"
      ],
      "type": "web_url",
      "url": [
        "https://www.ubs.com/global/en/about_ubs/investor_relations/agm.html"
      ]
    },
    "666": {
      "title": [
        "Corporate calendar"
      ],
      "type": "web_url",
      "url": [
        "https://www.ubs.com/global/en/about_ubs/investor_relations/ubs_events.html"
      ]
    }
  }
}
```

We stored the user IDs (investorList) and the Q&A data. Here we only have six questions. A simplified MapReduce technique is simulated for searching.

The templates is the format of message for each answer, because some may have links to it, and we want to customize each answer.

**The userData storing the investor list for each company is missing in the database here. It is hardcoded in the functions/postEvent/handler.js file for simplification.*

### Other Details
#### Detail data flow of market event report

<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t34.0-12/13706139_1216749095036521_1488263832_n.jpg?oh=89253b13c198bda789ff659cd6cf5bcf&oe=578C2C3C" 
alt="Feature View" width="180" height="320" border="10" />

1. In the analyst webpage, the analyst will insert the data into the webpage and submit it.

  <img src="https://scontent-hkg3-1.xx.fbcdn.net/t31.0-8/13723914_1217575978287166_7222692591402528362_o.jpg" alt="Market Event" width="320" height="320" border="10" />

2. The postEvent function will be trigered and parse the data into JSON format, which looks like this:
  
  ```
  {
  	"marketEvents": [
  		{
  			"title": "UK leaving the EU",
  			"effects": [
  				"Depreciation of Euro and GBP",
  				"Appreciation of USD",
  				"Depreciation of Crude Oil",
  				"Much higher taxes for agricultural product"
  			],
  			"affectedIndustries": {
  				"positive": [
  					"Louis Vuitton Moët Hennessy",
  					"Scotch Whiskey"
  				], 
  				"negative": [
  					"RyanAir",
  					"Volkswagen Group"
  				]
  			}
  		}
  	]
  }
  ```
3. The function will retrieve the userData from database (simplified into hard-coded data here), which looks like this:
  ```
  {
    "companyInvestors": {
        "LVMH": [
            "1120359171369250",
            "958628190914977"
        ],
        "Scotch Whiskey": [
            "1120359171369250",
            "1208270852551586"
        ],
        "RyanAir": [
            "1120359171369250",
            "958628190914977"
        ],
        "Volkswagen Group": [
            "1120359171369250",
            "1208270852551586"
        ]
    }
  }
  ```
  
4. The function will also retrieve the investor list from database, which looks like this:
  
  ```
  {
    "-KMjE0-EGUYqJhOzDiZv": "1120359171369250",
    "erqerew": "958628190914977",
    "erqrwert346": "1120359171369250"
  }
  ```
  
  **The keys are Firebase-inserted IDs, and the values are the user IDs. Can also modify to store the data as {userID: userName}*
5. The function starts to parse customized report for individual investors in the investorList.
6. Requests are sent to BOT for sending messages to the users.

<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t1.0-9/13700231_1217603448284419_7390474923258047615_n.jpg?oh=0e5489d06067a52195c76d8396cda5b6&oe=57F410EF" 
alt="Sample Report" width="180" height="320" border="50" />

#### Details of Q&A system

<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t34.0-12/13705077_1216749131703184_912853568_n.jpg?oh=f6efedb253119cb7d20c4ecab5bf0ea3&oe=578C9D8E" 
alt="No corresponding answer" width="180" height="320" border="50" />
<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t34.0-12/13705260_1216749248369839_408171493_n.jpg?oh=cb6ff7a8a2504e0db4e52b5ddc0596b3&oe=578CC0C4" 
alt="Suggesting questions based on keywords" width="180" height="320" border="50" />
<img src="https://scontent-hkg3-1.xx.fbcdn.net/v/t34.0-12/13689572_1216749261703171_1730182806_n.jpg?oh=6c9313b7b062480b0bd9e3e7ef9bd1a5&oe=578CAF38" 
alt="Answer in text form or links" width="180" height="320" border="50" />

**For code details, please review functions/bot/utils.processQAndA*

1. In the BOT, after receiving the user's messages, the engine will parse individual words into an array.
2. The function will retrieve keywords from the database. Each keyword looks like this:

  ```
  {"keyword": [111, 222]}
  ```
  
  where the numbers represent the corresponding question IDs.
  
3. The function will base on the results of the previous 2 steps and do a simple MapReduce to find out the top three matching questions stored in the database. Then these possible questions will be sent to the user for confirmation.
4. After the user confirmed, the function will retrieve the corresponding answer from the database and send to user.
