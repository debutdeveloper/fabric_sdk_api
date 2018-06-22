
const request = require('request');
const dateformat = require('dateformat');
var config = require('../../configuration/config');
var uniqid = require('uniqid')

//Add a new notification into notification table
module.exports.addNotification = function(req){
 
    return new Promise((resolve, reject) =>{
        var id = uniqid();

        var options = {
            url: 'http://localhost:5984/assetchain_assetchaincode/'+id,
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req)
        }
    
        request.put(options,(err, response, body) =>{
            if(err){
                err.http_status=500
                console.log(err)
                reject(err)
            }else{
                resolve(body)
            }
        })
    })
}

//This function will fetch all notifications from the couchdb
module.exports.fetchAllNotifications = function(user_id){

    return new Promise((resolve, reject) =>{

        var dt = new Date()
        dt.setTime(dt.getTime() - (24 * 60 * 60 * 1000))
        console.log(dt)
        var now = dateformat(dt  ,"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'")
        console.log(now)
        var query;

        var sort= [ {
            "created_at": "desc"
         }]

        //Admin case
        if(user_id==config.admin_id){
            query = {selector:{doc_type:"notification", "user.id":user_id, seen:false},sort:sort};
        }else{
            query = {selector:{doc_type:"notification", "user.id":user_id, end_timing: {"$gt":now}},sort:sort}
        }
        var options = {
            url: 'http://localhost:5984/assetchain_assetchaincode/_find',
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify(query)
        }
    
        request.post(options,(err, response, body) =>{
            if(err){
                err.http_status=500
                console.log(err)
                reject(err)
            }else{
                resolve(body)
            }
        })
    })

}

/**
 * This function will change the status of a notification
 * @param {String} notification_id 
 * @param {String} notification_status 
 */
module.exports.updateNotificationStatus = function(notification_id, notification_status){
return new Promise((resolve, reject)=>{
    var options = {
        url: "http://localhost:5984/assetchain_assetchaincode/_find",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "selector":{
                "doc_type": "notification",
                "_id": notification_id 
            }
        })
    }

    request.post(options,(err, response, body) =>{
        if(err){
            reject(err)
        }else{
            var docs = JSON.parse(body).docs;

            if(docs && docs.length > 0){
                var doc = docs[0];
                doc.action = notification_status;
                doc.seen = true;
                let options = {
                        "url": "http://localhost:5984/assetchain_assetchaincode/"+notification_id,
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": JSON.stringify(doc)
                }

                request.put(options,(error, resp, body)=>{
                    if(error){
                        reject(error)
                    }else{
                        resolve(body)
                    }
                })
            }

        }
    })
})
   

}



