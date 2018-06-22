var request = require('request');
var config = require('../../configuration/config');

//This function will send push notification
function sendPushNotification(data){
    console.log(data)
    var dt = JSON.stringify(data);
    var options = {
        url: 'https://fcm.googleapis.com/fcm/send',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "key="+config.cloud_messaging_key
          },
          body:JSON.stringify(data)
    };

    request.post(options,(err, response, body) =>{
        if(err){
            console.log(err)
        }else{
            console.log(response)
        }
    })
}

//This function defines the body of the notification
module.exports.sendPush = function(to, title, message, data){
    var notificationContent = {
        "to": to,
        "notification":{
          "title": title,
          "body": message
        },
        "data":{
            "title": title,
            "body": message 
        },
        "priority":"HIGH"
      }
      sendPushNotification(notificationContent)
}