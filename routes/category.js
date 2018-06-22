var category = require('../application/category/categorycode');
var check = require('express-validator/check');
var util = require('util');
var utility = require('./../application/utility/utility')
var express = require('express');
var router = express.Router();

//var front1 = {name:'car', description:'ndjhfkjsdn', status:'1'};
//var front2 = {name:'truck', description:'ndjhfkjsdn', status:'2', id:"bbhtoogb89ced24h1a70"};

/* GET categorys listing. */

router.get('/', function(req, res, next) {
  category.list().then(function(queRes){
    res.status(200).send(queRes);
    console.log('here')
  }).catch(function(err){
    res.status(422).send(err);
  });
  //res.send("List category");
});

//get detail of a category
router.get('/:id', function(req, res, next) {
  category.detail(req.params.id).then(function(queRes){
    res.status(200).send(queRes);
    console.log('here')
  }).catch(function(err){
    res.status(422).send(err);
  });
  //res.send("List category");
});

//create the category

router.post('/', function(req, res, next) {
  validateCreateCategory(req);
  var errors = req.validationErrors()
  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    category.createCategory(req.body).then(function(queRes){
      res.status(200).send(queRes);
    }).catch(function(err){
      res.status(500).send(err);
    });
  }
});

//update the category

router.put('/', function(req, res, next) {
  validateCreateCategory(req);
  var errors = req.validationErrors()
  if(errors){
    res.status(422).send(utility.createError(errors))
  }else{
    category.update(req.body).then(function(queRes){
      res.status(200).send(queRes);
    }).catch(function(err){
      res.status(500).send(err);
    });
  }
});
//change the status of the category
router.get('status/:id/:status', function(req, res, next) {
  category.changestatus(req.params.id,req.params.status).then(function(queRes){
    res.status(200).send(queRes);
  }).catch(function(err){
    res.status(500).send(err);
  });
  
});


//delete the category


router.delete('/:id', function(req, res, next) {
  category.delete(req.params.id).then(function(queRes){
    res.status(200).send(queRes);
  }).catch(function(err){
    res.status(500).send(err);
  });
  
});
//supportive function here 

function validateCreateCategory(req){
  req.checkBody('cat_name','Category Name is Required').exists().notEmpty()
  req.checkBody('description','Category desription is Required').exists().notEmpty()
  req.checkBody('status','Category status is required').exists().notEmpty()
  if(req.method=="PUT"){
    req.checkBody('id','Cateogary id is required').exists().notEmpty()
  }
  
}


module.exports = router;
