var RTMClient = require('@slack/client').RTMClient;
var WebClient = require('@slack/client').WebClient;
var request = require('request');

var slack_api_token = process.env.SLACK_API_TOKEN || '';
var pinboard_api_token = process.env.PINBOARD_API_TOKEN || '';
var bot;

var slack = new RTMClient(slack_api_token);
var web = new WebClient(slack_api_token);

slack.start();

slack.on('authenticated', function(data) {
  bot = data.self;
  console.log("Logged in as " + bot.name
        + " of " + data.team.name + ", but not yet connected");
});

slack.on('ready', function() {
    console.log('Connected');
    console.log(slack.users);
});


slack.on('message', (message) => {
  console.log("message!");
  // Structure of `event`: <https://api.slack.com/events/message>
  //console.log(message);
  try{
    if (message.user == bot.id) return; // Ignore bot's own messages
    console.log(message.text);
    console.log(message.user);
 
    var channel = message.channel;
    var user = message.user;
    var text = message.text;
    var tag;

    // can't get the username via api somehow
    // no username if a bot

    if(user){
      var r = "https://slack.com/api/users.info?token="+slack_api_token+"&user="+user;
      request(r, function (error, response, data) {
        if (!error && response.statusCode == 200) {
           //console.log(body);
           var jsonObject = JSON.parse(data);
           tag = jsonObject["user"]["profile"]["display_name"];
           console.log(tag);

           const regex = /(.*?)\<.*?\>(.*)/;
           const regex1 = /\<(.*?)\>/;

           var found = text.match(regex);
           console.log("found");

           var ff = found[1]+""+found[2];
           var description = ff.replace(/\s\s/gi, " ");
           console.log(description);

           var url = text.match(regex1);
           console.log("url");
           console.log(url[1]);
           var u, title;

           if(url && url[1]){
             u = url[1];
             title = u;
           }

           if(u && u!=""){
             request(u, function (error, response1, body) {
               if (!error && response1.statusCode == 200) {
                  var regex2 = /\<title\>(.*?)\<\/title\>/;
                  var ttt = body.match(regex2);
                  title = ttt[1]
                  console.log("title");
                  console.log(title);

                  var topost = "https://api.pinboard.in/v1/posts/add?"+
                    "auth_token="+pinboard_api_token+
                    "&url="+encodeURIComponent(u)+
                    "&description="+encodeURIComponent(title)+
                    "&extended="+encodeURIComponent(description)+"&tags="+tag;

                  console.log(topost);
                  request(topost, function (error, response2, body) {
                    if (!error && response2.statusCode == 200) {
                       console.log(body);
                    }else{
                       console.log("Error "+response2.statusCode)
                    }
                  });

               }else {
                  console.log("Error "+response1.statusCode)
               }
             });
           }

        }else {
           console.log("Error "+response.statusCode)
        }
      })
    }//end if user

   } catch (err){
    console.log(err);
   }

})

