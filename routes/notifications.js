var controller = require('../application/request/RequestController');

var util = require('util');
var express = require('express');
var router = express.Router();
var check = require('express-validator/check');
var utility = require('./../application/utility/utility')
var dateFormat = require('dateformat');
var notificationController = require('../application/notifications/NotificationController');


router.get('/',function(req, res, next){
    
    notificationController.fetchAllNotifications(req.user.id)
    .then((notifications) =>{
        res.send(notifications);
    }).catch((err) =>{
        res.status(500).send(err)
    });
});



module.exports = router;