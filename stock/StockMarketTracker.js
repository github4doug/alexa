var https = require('https');

exports.handler = (event, context, callback) => {
  try {
    if (event.session.new){
      console.log("NEW SESSION");
    }

    switch (event.request.type) {
      case "LaunchRequest":
      console.log("LAUNCH REQUEST");
      onLaunchRequest(event,context);
      break;
      case "IntentRequest":
      console.log("INTENT REQUEST");
      onIntentRequest(event,context);
      break;
      case "SessionEndedRequest":
      console.log("SESSION ENDED REQUEST");
      onSessionEndRequest(context);
      break;
      default:
      context.fail("Invalid request type" + event.request.type);
    }
  } catch (e) {
    context.fail("Exception:" + e);
  }
};

function onLaunchRequest(event, context){
  console.log("in function onLaunchRequest");
  context.succeed(
    generateResponse(buildSpeechletResponse(
      "Welcome to MarketTracker. Ask me what the stock market is like today.", false))
    );
}

function onIntentRequest (event,context){
  console.log("in function onIntentRequest");
  const intent = event.request.intent;

  if (intent.name == 'getIndex'){
    console.log("calling intent getIndex");
    getIndex(intent, context);
  } else if (intent.name == 'AMAZON.CancelIntent'){
    onSessionEndRequest(context);
  } else if (intent.name == 'AMAZON.HelpIntent') {
    onLaunchRequest(event, context);
  } else if (intent.name == 'AMAZON.StopIntent') {
     onSessionEndRequest(context);
  }
}

function getIndex(intent, context){
  const apiKey = process.env.API_KEY;
  const endpoint = 'https://www.alphavantage.co/query?' +
  "function=TIME_SERIES_DAILY&symbol=DJI&apikey=" + apiKey;
  var body = "";
  https.get(endpoint, (response) => {
    response.on('data', (chunk) => {
      console.log('received data response');
      body += chunk;
    });
    response.on('end', ()=> {
      var jsonData = JSON.parse(body);
      var timeSeriesData = jsonData["Time Series (Daily)"];
      var currentValue = "";
      for (var key in timeSeriesData){
        var dayData = timeSeriesData[key];
        currentValue = dayData["4. close"];
        break;
      }
      console.log("current stock value is" + currentValue);
      var speechOutput = `DJIA is ${currentValue}. Thank you for using MarketTracker. Good bye`;
      context.succeed(generateResponse(buildSpeechletResponse(speechOutput, false), {}));
    });
  });
}

function onSessionEndRequest(context){
  console.log ("in function onSessionEndRequest");
  var speechOutput = 'Thank you for trying the Stock Market Tracker. Have a nice day!';
  context.succeed(generateResponse(buildSpeechletResponse(speechOutput,true),{}));
}

const buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    card: {
      type: "Simple",
      title: "Stock Tracker",
      content: outputText
    },
    shouldEndSession: shouldEndSession
  };
};

const generateResponse = (speechletResponse, sessionAttributes) => {
    return {
      version: "1.0",
      sessionAttributes: sessionAttributes,
      response: speechletResponse
    };
};
