var https = require('https');

exports.handler = (event, context, callback) => {
  try {
    if (event.session.new){
      console.log("NEW SESSION");
      onSessionStarted(event.request.requestId);
    }

    switch (event.request.type) {
      case "LaunchRequest":
      console.log("LAUNCH REQUEST");
      onLaunchRequest(event.request.requestId,callback);
      break;
      case "IntentRequest":
      console.log("INTENT REQUEST");
      onIntentRequest(event.request,callback);
      break;
      case "SessionEndedRequest":
      console.log("SESSION ENDED REQUEST");
      onSessionEnded(event.request.requestId);
      break;
      default:
      context.fail("Invalid request type" + event.request.type);
    }
  } catch (e) {
    context.fail("Exception:" + e);
  }
};

function onSessionStarted(requestId){
  console.log('In function onSessionStarted: ' + requestId);
}
function onSessionEnded(requestId){
  console.log('In function onSessionEnded: ' + requestId);
}

function handleWelcomeResponse(callback){
  console.log ("In function handleWelcomeResponse");
  const title = "Welcome";
  const speechOutput = "What stock would you like information on? " +
  "I have information on Apple, Google, VMWare, IBM and Amazon";
  const repromptText = "I'm sorry I didn't get you. What stock would you like information on? " +
  "I have information on Apple, Google, VMWare, IBM and Amazon";
  const speechResponse = buildSpeechletResponse(title, speechOutput, repromptText,false);
  // can also use context.succeed
  callback(null, generateResponse(speechResponse,{}));
}
function onLaunchRequest(requestId, callback){
  console.log("In function onLaunchRequest");
  handleWelcomeResponse(callback);
}

function onIntentRequest (request,callback){
  console.log("In function onIntentRequest");
  const intent = request.intent;

  if (intent.name == 'GetStockInfo'){
    console.log("calling intent getStockInfo");
    getStockInfo(request, callback);
  } else if (intent.name == 'AMAZON.CancelIntent'|| intent.name == 'AMAZON.StopIntent'){
    onSessionEnded(request.requestId);
  } else if (intent.name == 'AMAZON.HelpIntent') {
    onLaunchRequest(request.requestId, callback);
  } else {
    throw new Error("Could not identify intent: " + intent.name);
  }
}

function getStockInfo(request, callback){
  console.log("In function getStockInfo");
  fillSlots(request, callback);
  var slots = request.intent.slots;
  var stockName = slots.StockName.value;
  var stockDay = slots.StockDay.value;
  var priceType = slots.PriceType.value;
  console.log("all slots filled");
  getStockPrice(stockName, stockDay, priceType, callback);
}

function getStockPrice(stockName, stockDay, priceType, callback){
    console.log("In function getStockPrice");
    console.log("Stock name:" + stockName);
    console.log("Stock day:" + stockDay);
    console.log("Price type:" + priceType);
    var tickerMap = {
      "apple": "AAPL",
      "vmware": "VMW",
      "ibm": "IBM",
      "google": "GOOG",
      "amazon": "AMZN"
    };
    var priceMap = {
      "opening": "open_price",
      "closing": "close_price",
      "maximum": "high_price",
      "high": "high_price",
      "low": "low_price",
      "minimum": "low_price"
    };

    var stockTicker  = tickerMap[stockName.toLowerCase()];
    var priceTypeCode = priceMap[priceType.toLowerCase()];
    var pathString = "/historical_data?ticker=" + stockTicker +
    "&item=" + priceTypeCode +
    "&start_date=" + stockDay +
    "&end_date=" + stockDay;
    console.log("Path string:" + pathString);
    var username=process.env.API_USERNAME;
    var password=process.env.API_PASSWORD;
    var auth = "Basic " + new Buffer(username + ":" + password).toString('base64');
    https.get({
      host: "api.intrinio.com",
      port: 443,
      path: pathString,
      headers: {
        "Authorization": auth
      }
    }, function(response){
      var json = "";
      response.on('data', function(chunk){
        console.log("Recieved json response: " + chunk);
        json += chunk;
      });
      response.on('end', function(){
        var jsonData = JSON.parse(json);
        var stockPrice = jsonData.data[0].value;
        console.log("The stock price recieved is: " + stockPrice);
        const title = "Stock Price";
        var speechOutput = stockName + " " + priceType +
        " price was at " + stockPrice + " for " + stockDay;
        const speechletResponse = buildSpeechletResponse(title,speechOutput, null,true);
        callback(null, generateResponse(speechletResponse,{}));
      });
    });



}

function fillSlots(request, callback){
  console.log("In function fillSlots");
  console.log("Dialog state: " + request.dialogState);
  console.log("Intent: " + request.intent);

  if (request.dialogState !== "COMPLETED"){
    console.log("Dialog.Delegate directive prompt for more information");
    const speechletResponse = {
      outputSpeech: null,
      card:null,
      reprompt: null,
      shouldEndSession: false,
      directives: [{
        type: "Dialog.Delegate"
      }]
    };
    callback(null, generateResponse(speechletResponse,{}));
  }
}

const buildSpeechletResponse = (title, outputText, repromptText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    card: {
      type: "Simple",
      title: title,
      content: outputText
    },
    reprompt: {
      outputSpeech:{
        type: "PlainText",
        text: repromptText
      }
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
