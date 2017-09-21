var alexa = require('alexa-app');
var chatskills = require('chatskills');
var readlineSync = require('readline-sync');
var xml2js = require('xml2js').parseString;
var request = require('request');
var deasync = require('deasync');

// Define an alexa-app
//var app = new alexa.app('books');
var app = chatskills.app('books');

// Goodreads API key.
var key = 'YOUR API KEY';

// Helper method to call Goodreads API.
function getBook(title) {
  var book = null;
  var url = 'https://www.goodreads.com/book/title.xml?key=' + key + '&title=' + title;

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      xml2js(body, function (error, result) {
        if (!error) {
          // Extract just the fields that we want to work with. This minimizes the session footprint and makes it easier to debug.
          var b = result.GoodreadsResponse.book[0];
          book = { id: b.id, title: b.title, ratings_count: b.ratings_count, average_rating: b.average_rating, authors: b.authors };
        }
        else {
          book = { error: error };
        }
      });
    }
    else {
      book = { error: error };
    }
  });

  // Wait until we have a result from the async call.
  deasync.loopWhile(function() { return !book; });

  return book;
}

app.launch(function(req,res) {
  res.say('What book would you like to know about? Please say get book, followed by the title.').reprompt('Please say get book, followed by the title.').shouldEndSession(false);
});

app.intent('getBook', {
        'slots': {'TitleOne': 'TITLE',
                  'TitleTwo': 'TITLE',
                  'TitleThree': 'TITLE',
                  'TitleFour': 'TITLE',
                  'TitleFive': 'TITLE'},
        'utterances': ['get {a|the|that|} book',
                       'get {a|the|that|} book {-|TitleOne}',
                       'get {a|the|that|} book {-|TitleOne} {-|TitleTwo}',
                       'get {a|the|that|} book {-|TitleOne} {-|TitleTwo} {-|TitleThree}',
                       'get {a|the|that|} book {-|TitleOne} {-|TitleTwo} {-|TitleThree} {-|TitleFour}',
                       'get {a|the|that|} book {-|TitleOne} {-|TitleTwo} {-|TitleThree} {-|TitleFour} {-|TitleFive}']
    }, function(req,res) {
      var title = req.slot('TitleOne');
      if (title) {
        var message = '';

        // Capture additional words in title.
        var TitleTwo = req.slot('TitleTwo') || '';
        var TitleThree = req.slot('TitleThree') || '';
        var TitleFour = req.slot('TitleFour') || '';
        var TitleFive = req.slot('TitleFive') || '';

        // Concatenate all words in the title provided.
        title += ' ' + TitleTwo + ' ' + TitleThree + ' ' + TitleFour + ' ' + TitleFive;
        
        // Trim trailing comma and whitespace.
        title = title.replace(/,\s*$/, '');

        var book = getBook(title);
        if (!book.error && book.title) {
          // Store the book in session.
          res.session('book', book);

          // Respond to the user.
          message = 'Ok. I found the book ' + book.title;
        }
        else {
          message = "Sorry, I can't seem to find that book.";
        }
      }
      else {
        message = 'What book would you like to get? Please say get book, followed by the title.';
      }

      // We have a book in session, so keep the session alive.
      res.say(message).shouldEndSession(false);      
    }
);

app.intent('getRating', {
        'slots': {},
        'utterances': ['what is the {average|} rating',
                       "{what's|whats} the {average|} rating",
                       'rating',
                       'average rating']
    }, function(req,res) {
      var message = '';

      var book = req.session('book');
      if (book) {
        message = 'There are ' + book.ratings_count + ' user ratings. The average rating is ' + book.average_rating;
      }
      else {
        message = 'Please say get book, followed by the title.';
      }

      res.say(message).shouldEndSession(false);
    }
);

app.intent('getAuthor', {
        'slots': {},
        'utterances': ['who is the author',
                       'who are the authors',
                       "{whos|who's} the author",
                       "{whats|what's} the author",
                       "{author|authors}",
                       'who was {it|the book} {written|authored} by',
                       'who wrote {it|the book}']
    }, function(req,res) {
      var message = '';

      var book = req.session('book');
      if (book) {
        // Concatenate author names into a response.
        book.authors.forEach(function(element) {
          author = element.author[0];
          message += author.name + ',';
        });

        // Trim trailing comma and whitespace.
        message = message.replace(/,\s*$/, '');
      }
      else {
        message = 'Please say get book, followed by the title.';
      }

      res.say(message).shouldEndSession(false);
    }
);

app.intent('AMAZON.StopIntent', {
        'slots': {},
        'utterances': ['{quit|exit|thanks|bye|thank you}']
    }, function(req,res) {
      res.say('Goodbye.').shouldEndSession(true);
    }
);

app.intent('AMAZON.CancelIntent', {
        'slots': {},
        'utterances': []
    }, function(req,res) {
      res.say('Goodbye.').shouldEndSession(true);
    }
);

app.intent('AMAZON.HelpIntent', {
        'slots': {},
        'utterances': []
    }, function(req,res) {
      message = 'I can tell you details about books from GoodReads. To find a book, just say get book, followed by the title. You can also ask who is the author or what is the rating.';
      res.say(message).shouldEndSession(false);
    }
);

module.exports = app;

chatskills.launch(app);
// Console client.
var text = ' ';
while (text.length > 0 && text != 'quit') {
    text = readlineSync.question('> ');
    // Respond to input.
    chatskills.respond(text, function(response) {
        console.log(response);
    });
}
