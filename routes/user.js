var user = require('../application/user/UserController');
var check = require('express-validator/check');
var util = require('util');
var utility = require('./../application/utility/utility')
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../configuration/config');
var mail = require('../application/mail/MailController')

//get list of users
router.post('/', function(req, res, next) {
  user.listAllUsers(req.body).then((response) =>{
  res.send(response)
  }).catch((err) => {
    res.status(500).send(err)
  })
});

//login user
router.post('/login', function(req, res, next) {
  validateLogin(req)
  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.login(req.body).then(function(queRes){

      var token = jwt.sign(
        {
          id:queRes.id,
          email:queRes.data.email,
          first_name:queRes.data.first_name,
          last_name:queRes.data.last_name,
          device_token: queRes.data.device_token
        },
          config.secret,{expiresIn: "24h"})
      queRes.data.token = token;

      delete queRes.data.password
      
      res.send(queRes);
    }).catch(function(err){
      res.status(err.http_status).send(err);
    });
  }
});


//Change user password
router.put("/change-password", function(req, res, next){

  validateChangePassword(req)

  var errors = req.validationErrors()

  if (errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.changePassword(req.body).then((result) => {
      res.send(result)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})

//Get user from id
router.get("/detail", function(req, res, next){

  if(req.query.id){
      user.getUser(req.query).then((result) => {
        res.send(result)
      }).catch((err) => {
        res.status(err.http_status).send(err)
      })
  }else{
    res.status(422).send({message: "user id is required", status: 0})
  }
})

router.put("/forget-password", function(req, res, next){

  validateForgetPassword(req)

  var errors = req.validationErrors()

  if (errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.forgetPassword(req.body).then((result) => {
      mail.sendForgotPasswordEmail(req.body.email,result.data.new_password);
      delete result.data
      res.send(result)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})

/**
 * This function will be used for validation of change password api
 * @param {Object} req 
 */
function validateChangePassword(req){
  req.checkBody('id',"Please enter a user id").exists().notEmpty()
  req.checkBody('old_password',"Please enter your old password").exists().notEmpty()
  req.checkBody('new_password',"Please enter new password").exists().notEmpty()
  req.checkBody('confirm_password',"Please enter password again in confirm password")
    .exists().notEmpty()

  req.assert('new_password',"New password and confirm password should be same").equals(req.body.confirm_password);
}

function validateForgetPassword(req){
  req.checkBody('email',"Please enter a email").exists().notEmpty().isEmail()
  
}

//Change user active, inactive status
router.put('/change-user-status', function(req, res, next){
  validateUserStatus(req)
  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.changeUserStatus(req.body).then((resp) =>{
      res.send(resp)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})


/**
 * This function will be used for user active/inactive status validation
 * @param {Object} req 
 */
function validateUserStatus(req){
  req.checkBody('id',"Please enter user id").exists().notEmpty()
  req.checkBody('user_status',"Please specify the active status").exists()
}


router.put('/update-admin', function(req, res, next){
  //updateAdminProfile
  validateAdminUpdateBody(req)

  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.updateAdminProfile(req).then((resp) =>{
      res.send(resp)
    }).catch((err) => {
      res.status(err.http_status).send(err)
    })
  }
})

/**
 * This function will be used for user active/inactive status validation
 * @param {Object} req 
 */
function validateAdminUpdateBody(req){
  
  req.checkBody('first_name',"First name is required").exists().notEmpty()
  req.checkBody('last_name',"Last name is required").exists().notEmpty()
}



/**
 * This function will validate login parameters
 * @param {Object} req 
 */
function validateLogin(req){
  req.checkBody('email','Please enter a valid email address').isEmail()
  req.checkBody('email','Please enter a your email address').notEmpty()
  req.checkBody('password','Please enter  your password').notEmpty()
  // req.checkBody('type','type field is required').exists()
  req.checkBody('device_token','Device token is required').notEmpty()
}

/**
 * This router will be used for user registration
 */
router.post('/create', function(req, res, next) {
  validateRegistration(req)
  var errors = req.validationErrors();

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.createUser(req.body).then(function(queRes){

      var token = jwt.sign(
        {
          id:queRes.data.user_id,
          email:queRes.data.email,
          device_token: req.device_token,
          first_name: queRes.data.first_name,
          last_name: queRes.data.last_name
        }
          ,config.secret,{expiresIn: "24h"})
      queRes.data.token = token;
      res.send(queRes);
      mail.sendRegistrationEmail(queRes.data.email,queRes.data.generated_password)
    }).catch(function(err){
      res.status(err.http_status).send(err);
    });
}
});


/**
 * This function will validate the request body
 */
function validateRegistration(req){
  req.checkBody('first_name','First name is required').exists().notEmpty()
  req.checkBody('last_name','Last name is required').exists().notEmpty()
  req.checkBody('emp_id','Employee Id is required').exists().notEmpty()
  req.checkBody('country_code','Country code is required').exists().notEmpty()
  req.checkBody('phone_num','Phone number is required').exists().notEmpty()
  req.checkBody('email','Email address is required').exists().notEmpty()
  req.checkBody('email','Please enter a valid email').isEmail()
  req.checkBody('device_token','Device token is required').exists().notEmpty()
}

router.put('/', function(req, res, next) {
  res.send("update user");
});


//Router for user deletion
router.delete('/', function(req, res, next) {
  validateDeleteBody(req)
  var errors = req.validationErrors()

  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    user.deleteUser(req.body).then(function(queRes){
      res.send(queRes);
    }).catch(function(err){
      res.status(err.http_status).send(err);
    });
  }
});

/**
 * This function will validate the request body of delete router
 * @param {Object} req 
 */
function validateDeleteBody(req){
  req.checkBody(req.id,"Please enter your user id").exists()
  req.checkBody(req.id,"Please enter a valid user id").notEmpty()
}



/**
 * This function will create an error response
 * @param {Array<Object>} errors 
 */
function createErrorResponse(errors){
return {status:0, message: errors[0].msg}
}

module.exports = router;
