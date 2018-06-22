var controller = require('../application/request/RequestController');
var inAppNotificationController = require('../application/notifications/NotificationController');
var userController = require('../application/user/UserController');

var util = require('util');
var express = require('express');
var router = express.Router();
var check = require('express-validator/check');
var utility = require('./../application/utility/utility')
var dateFormat = require('dateformat');
var notificationController = require('../application/push_notification/PushNotificationController');
var userController = require('../application/user/UserController');
var config = require('../configuration/config');
// const userController = require('../application/user/UserController');


//Router for creating request
router.post('/',function(req,res,next){

  validateCreateRequestBody(req)
  var errors = req.validationErrors();

  if (errors){
    res.status(422).send(utility.createError(errors))
  }else{
    controller.createRequest(req.body).then((result) =>{
      res.send(result)
      setTimeout(()=>{
        var io = global.socket_io;
        io.emit('request_added',"");
      },4000)
    

    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})

/**
 * This function will validate the request body for create asset api
 * @param {Object} req 
 */
function validateCreateRequestBody(req){
  req.checkBody('description',"Please enter description").exists().notEmpty()
  req.checkBody('start_time',"Please enter request start time").exists().notEmpty()
  req.checkBody('end_time',"Please enter request end time").exists().notEmpty()
  req.checkBody('priority',"Please enter priority").exists().notEmpty()
  req.checkBody('user.id',"Please enter your id").exists().notEmpty()
  req.checkBody('user.first_name',"Please enter your first name").exists().notEmpty()
  req.checkBody('user.last_name',"Please enter your last name").exists().notEmpty()
  req.checkBody('asset.id',"Please enter asset id").exists().notEmpty()
  req.checkBody('asset.name',"Please enter asset name").exists().notEmpty()
  req.checkBody('asset.description',"Please enter asset description").exists().notEmpty()
}

//List all requests
router.post('/all-requests',function(req,res,next){
  if(req.body.field_type == undefined || ( req.body.field_type >= 0 || req.body.field_type <= 1)){
    if(req.body.field_type == undefined || req.body.sort_type == -1 || req.body.sort_type == 1){
    controller.listAllRequest(req.body).then((result) =>{
      res.send(result)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }else{
    res.status(422).send({message: "Invalid sort type"})
  }
}else{
  res.status(422).send({message: "Invalid field type"})
}
  
})

//fetch a request based on id
router.get('/fetch-request/:id',function(req,res,next){

  req.checkParams('id',"Please enter the request id").exists().notEmpty()
  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    controller.requestByID(req.params).then((result) =>{
      res.send(result)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})

//fetch requests based on asset id
router.get('/requests/:asset_id',function(req, res, next){

  console.log(req.params)

  if(req.params.asset_id){

    controller.getRequestsForAssets(req.params.asset_id).then((result) =>{
      res.send(result)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })

  }else{
    res.status(422).send({message:"Asset id is required", status:0})
  }

})

//Router for updating the status of request
router.put('/update-status',function(req,res,next){

  validateUpdateStatusBody(req)
  var errors = req.validationErrors()

  if (errors){
    res.status(422).send(utility.createError(errors))
  }else{
    controller.changeStatus(req.body).then((result) =>{
      res.send(result)
      

      userController.getUser({id: req.body.user_id})
      .then((user) =>{
        var action;
        if(req.body.status == 1){
          notificationController.sendPush(user.data.device_token,
                                          "AssetChain - Request Approved",
                                          "Admin has approved your request for "+req.body.asset_name)
          action = 4;
        }else if(req.body.status == 3){
          notificationController.sendPush(user.data.device_token,
                                          "AssetChain - Request Rejected",
                                          "Admin has rejected your request for "+req.body.asset_name)
          action = 5;
        }

        controller.requestByID({id:req.body.id}).then((result)=>{

          var dt = dateFormat(new Date(), "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'")
      

          var notificationData = {
                                    sender:{id:config.admin_id, first_name:"admin"},
                                    user:{id: result.data.request.user.id,
                                          first_name: result.data.request.user.first_name,
                                          last_name:result.data.request.user.last_name},
                                    asset:{description: result.data.request.asset.description,
                                          id: result.data.request.asset.id,
                                          name: result.data.request.asset.name},
                                    created_at: dt,
                                    updated_at: dt,
                                    seen: false,
                                    type: 2,
                                    action: action,
                                    doc_type:"notification",
                                    request_id: req.body.id,
                                    start_timing: result.data.request.start_timing,
                                    end_timing: result.data.request.end_timing,
                                    priority: result.data.request.priority,
                                    description: result.data.request.description,
                                    req_type: 0
                                  }

            inAppNotificationController.addNotification(notificationData).then((result)=>{
              console.log("In-App Notification has been added to list LOGS => " + result)
            }).catch((err) =>{
              console.error("In-App Notification COULD NOT be sent LOGS => " + err)
            })
        }).catch((err) =>{
          console.error(err)
        })

      })
      
    }).catch((err) =>{
      res.status(err.http_status).send(err)
    })
  }

})

/**
 * This function will validate the request body of update status api
 * @param {Object} req 
 */
function validateUpdateStatusBody(req){

  req.checkBody('id',"Please enter id").exists().notEmpty()
  req.checkBody('status',"Please enter a status").exists()
  req.checkBody('user_id',"user_id is required").exists()
  req.checkBody('asset_name',"asset_name is required").exists()
  // req.checkBody('status',"Please enter a valid status").custom((value) =>{
  //   return new Promise((resolve, reject) =>{
  //     if (value <0 || value >5){
  //         reject()
  //     }else{
  //         resolve()
  //     }
  //   })
  // })
}

//Router for updating the time slot of request
router.put('/update-timeslot',function(req,res,next){

  validateTimeSlotBody(req)
  var errors = req.validationErrors()

  if (errors){
    res.status(422).send(utility.createError(errors))
  }else{
    controller.updateTimeSlot(req.body).then((result) =>{
      res.send(result)
    }).catch((err) =>{
      res.status(err.http_status).send(err)
    })
  }
})

//Router to fetch requests linked to user id
router.get('/approved-requests',function(req,res,next){
    controller.requestByUserID(req.user).then((result) =>{
      res.send(result)
    }).catch((err) =>{
      res.status(err.http_status).send(err)
    })
  
})

/**
 * This function will validate request body for time slot update api
 * @param {Object} req 
 */
function validateTimeSlotBody(req){
  req.checkBody('id',"Please enter id").exists().notEmpty()
  req.checkBody('start_time',"Please enter start time").exists().notEmpty().isDate()
  req.checkBody('end_time',"Please enter end time").exists().notEmpty().isDate()
}

//Router for getting next immediate request
router.post('/next-request', function(req, res, next){
  validateNextRequest(req)

  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    controller.nextRequest(req).then((result) =>{
      res.send(result)
    }).catch((err) =>{
      res.status(err.http_status).send(err)
    })
  }
})

/**
 * This function will validate next request api validations
 * @param {Object} req 
 */
function validateNextRequest(req){
  req.checkBody('asset_id', "Asset id is required").exists().notEmpty()
}

//This function will send handover request to user/admin
//if handover is done to user, then send req_type=0 else 1
router.put('/handover',function(req, res, next){
  if(req.body.req_type !=  undefined && (req.body.req_type == 0 || req.body.req_type == 1)){
    validateUserHandoverRequest(req)
    var errors = req.validationErrors()
  
    if(errors){
      res.status(422).send(utility.createError(errors))
    }else{

      if(req.body.req_type == 1){
        req.body.user = {id:config.admin_id, first_name:"admin"}
      }

      req.body.sender = {
                            id:req.user.id,
                            first_name: req.user.first_name,
                            last_name: req.user.last_name
                        }

      req.body.doc_type="notification"

      var dt = dateFormat(new Date(), "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'")
      req.body.created_at = dt
      req.body.updated_at = dt
      req.body.seen = false
      req.body.action = 0 //pending always
      req.body.type = 1// for handover
      req.body.req_type = parseInt(req.body.req_type)
      inAppNotificationController.addNotification(req.body).then((result) =>{
        res.send(result)
        
        //if handover is done to user, then send notification
        if(req.body.req_type == 0){

          userController.getUser({id: req.body.user.id}).then((user) =>{
            notificationController.sendPush(user.data.device_token,
                                          "AssetChain - Handover Request",
                                          "You have received a new handover request for an asset.",
              null)
          }).catch((err) =>{
            console.log("Could not get user.. error => " + err)
          });
          
        }
  
      }).catch((err) =>{
        console.log("Handover Error =================>>>>>>>>>>>  " + err)
        res.status(err.http_status).send(err)
      })
    }
  }else{

    res.status(422).send({status: 0, message: "Invalid request type"})
  }
});


/**
 * This function will validate handover request api validations
 * @param {Object} req 
 */
function validateUserHandoverRequest(req){
  if(req.body.req_type == 0){
    //For handover to user
    req.checkBody('description', "Request description is required").exists().notEmpty()
    req.checkBody('start_timing', "Start time is required").exists().notEmpty()
    req.checkBody('end_timing', "End time is required").exists().notEmpty()
    req.checkBody('priority', "End time is required").exists().notEmpty()
    req.checkBody('user.id', "User id is required").exists().notEmpty()
    req.checkBody('user.first_name', "User firstname field is required").exists().notEmpty()
    req.checkBody('user.last_name', "User lastname  is required").exists().notEmpty()
    req.checkBody('asset.id', "Asset id  is required").exists().notEmpty()
    req.checkBody('asset.name', "Asset name  is required").exists().notEmpty()
    req.checkBody('asset.description', "Asset description  is required").exists().notEmpty()
    req.checkBody('request_id', "Request id  is required").exists().notEmpty()
  }else if(req.body.req_type == 1){
      //For handover to admin
    req.checkBody('asset.id', "Asset id  is required").exists().notEmpty()
    req.checkBody('asset.name', "Asset name  is required").exists().notEmpty()
    req.checkBody('asset.description', "Asset description  is required").exists().notEmpty()
  }

  // req.checkBody('old_request_id', "Old request id is required").exists().notEmpty()
  
}


//This router will be used for handover action
//action 0= accept, 1 = reject
//req_type 0 = action will be taken by user, req_type 1 = action will be taken by admin
router.put('/handover-action', function(req, res, next){

  if(req.body.action != undefined && (req.body.action == 0 || req.body.action == 1)){
      //check request type
    if(req.body.req_type != undefined && (req.body.req_type == 0 || req.body.req_type ==1)){
      validateHandoverActionBody(req)
      var errors = req.validationErrors()
    
      if(errors){
        res.status(422).send(utility.createError(errors))
      }else{
        if(req.body.req_type == 0){
          req.body.user = {id: req.user.id,first_name: req.user.first_name,last_name:req.user.last_name}
        }else{
          req.body.user = {id: req.user.id,first_name: "Admin",last_name:""}
        }
        
        controller.takeHandoverAction(req.body).then((response)=>{
          res.send(response)

         setTimeout(()=>{
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
        
          console.error("*********************************************")
          console.error("*********************************************")
        
          console.error("*********************************************")
          console.error("*********************************************")
        
          console.error("*********************************************")
          console.error("*********************************************")
          
          console.error("*********************************************")
          console.error("*********************************************")
          
          console.error("*********************************************")
        
        
          console.error("EVENT EMITTED")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          console.error("*********************************************")
          
          var io = global.socket_io;
          io.emit('handover_action',"");
         },4000);

        }).catch((err)=>{
          res.status(500).send(err)
        })
      }
    }else{
      res.status(422).send({status: 0, message: "Invalid request type"})
    }
  }else{
    res.status(422).send({status: 0, message: "Invalid handover action"})
  }
});

/**
 * This function will send handover action event
 */
function sendHandoverActionEvent(){
  var io = global.socket_io;
  io.emit('handover_action',"");

  
  
  
  
}


/**
 * This function will validate handover-action request body
 * @param {Object} req 
 */
function validateHandoverActionBody(req){
  if(req.body.req_type == 0){
    req.checkBody('request_id', "Request id is required").exists().notEmpty()
  }
  req.checkBody('asset_id', "Asset id is required").exists().notEmpty()
  req.checkBody('notification_id', "Notification id is required").exists().notEmpty()
  // req.checkBody('old_request_id', "Old request id is required").exists().notEmpty()
  
}

// //This rout will be used to sort out the requests.
// router.post('/sort-requests',function(req, res, next){
//   validateSortRequestBody(req)
//   var errors = req.validationErrors()
//   if(errors){
//     res.status(422).send(utility.createError(errors))
//   }else{
//   if(req.body.field_type == 0 || req.body.field_type == 1){
//     if(req.body.sort_type == -1 || req.body.sort_type == 1){
    
//       controller.sortRequests(req.body).then((response)=>{
//         res.send(response)
//       }).catch((err)=>{
//         res.status(500).send(err)
//       })

//     }else{
//       res.status(422).send({message: "Invalid sort type"})
//     }
//   }else{
//     res.status(422).send({message: "Invalid field type"})
//   }
// }

 


// })

// /**
//  * This function will validate sort request body
//  * field_type => 0 for Employee Name
//  * field_type => 1 for Employee Id
//  * 
//  * sort_type => -1 for descending order
//  * sort_type => 1 for ascending order
//  * @param {Object} req 
//  */
// function validateSortRequestBody(req){
//   req.checkBody('field_type', "Field type is required").exists()
//   req.checkBody('sort_type', "Sort type is required").exists()
// }

module.exports = router;
