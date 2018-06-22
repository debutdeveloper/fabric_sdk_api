var asset = require('../application/asset/assetcode');

var util = require('util');
var utility = require('./../application/utility/utility')
var express = require('express');
var router = express.Router();
var moment = require('moment');

/* GET users listing. */

router.post('/', function(req, res, next) {
  asset.listAllAsset(req.body).then(function(queRes){
    
    res.status(200).send(queRes);
  }).catch(function(err){
    res.status(500).send(err);
  });
  
});

//get detail of a assets
router.get('/:id', function(req, res, next) {
  asset.detail(req.params.id).then(function(queRes){
    res.status(200).send(queRes);
    console.log('here')
  }).catch(function(err){
    res.status(422).send(err);
  });
  //res.send("List category");
});

router.post('/create', function(req, res, next) {
  validateAsset(req);
  var errors = req.validationErrors()
  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    asset.createAsset(req.body).then(function(queRes){
      res.status(200).send(queRes);
    }).catch(function(err){
      //res.status(err.status).send(err);
      res.status(500).send(err);
    });
  }//res.send("create asset");
});

router.put('/', function(req, res, next) {
  validateAsset(req);
  var errors = req.validationErrors()
  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    asset.updateAsset(req.body).then(function(queRes){
      res.send(queRes);
    }).catch(function(err){
      res.send(err);
    });
  }
  //res.send("update asset");
});

router.delete('/:id', function(req, res, next) {
  asset.delete(req.params.id).then(function(queRes){
    res.status(200).send(queRes);
  }).catch(function(err){
    res.status(500).send(err);
  });
  
});

/**
 * This function will validate asset request body
 * @param {Object} req 
 */
function validateAsset(req){
  req.checkBody('name','asset name is required').exists().notEmpty()
  // req.checkBody('description','Desription is required').exists().notEmpty()
  req.checkBody('status','asset status is required').exists().notEmpty()
  req.checkBody('asset_number','asset_number is required').exists().notEmpty()
  req.checkBody('serial_number','serial_number is required').exists().notEmpty()
  // req.checkBody('color','color is required').exists().notEmpty()
  // req.checkBody('quantity','quantity is required').exists().notEmpty()
  // req.checkBody('purchase_date','purchase_date is required').exists().notEmpty()
  // req.checkBody('purchasing_amount','Purchase amount is required').exists().notEmpty()
  // req.checkBody('warranty_upto','warranty_upto is required').exists().notEmpty()
  req.checkBody('categoryid','category is required').exists().notEmpty()
  req.checkBody('category_name','category_name is required').exists().notEmpty()
  if(req.method=="PUT"){
    req.checkBody('key','Asset Key is required').exists().notEmpty()
  }
}

/**
 * This API will change the status of asset i.e inactive or active
 */
router.put('/change-status', function(req, res, next){
  validateAsset(req);
  var errors = req.validationErrors()
  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    asset.changeAssetStatus(req.body).then((result) =>{
      res.status(200).send(result);
    }).catch((err) =>{
      res.status(500).send(err)
    })
  }
  
})

function validateChangeStatusBody(req){
  req.checkBody('id',"Please enter asset id").exists().notEmpty()
  req.checkBody('status',"Asset status is required").exists().notEmpty().isIn([0,1])
}


module.exports = router;
