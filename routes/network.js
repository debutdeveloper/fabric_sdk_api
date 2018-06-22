var network = require('../application/Controllers/NetworkController');
var check = require('express-validator/check');
var util = require('util');
var utility = require('./../application/utility/utility')
var express = require('express');
var router = express.Router();


router.get('/peer', function(req, res, next) {
    network.channelList().then(function(queRes){
    res.status(200).send(queRes);
    
  }).catch(function(err){
    res.status(422).send(err);
  });
  
});
router.get('/height', function(req, res, next) {
  network.chaininfo().then(function(queRes){
  res.status(200).send(queRes);
  
}).catch(function(err){
  res.status(422).send(err);
});

});


router.get('/channels', function(req, res, next) {
  
  network.channels().then(function(queRes){
  res.status(200).send(queRes);
}).catch(function(err){
  res.status(422).send(err);
});

});

router.post('/blocks', function(req, res, next) {
  var start = 0;
  var length = 9

  var blocks = new Array();

  if(req.body.start && req.body.length && req.body.start < req.body.length){
    start = req.body.start;
    length = req.body.length;
  }else{
    req.body.start = start;
    req.body.length = length;
  }

  buildBlockChain(start,req, res,blocks);

});

// This function will create block array
function buildBlockChain(counter, req, res, blocks){
  if(counter < req.body.start+req.body.length){
    network.blocks(counter).then(function(queRes){
      blocks.push(queRes);
      counter++;
      buildBlockChain(counter,req,res,blocks)
    }).catch(function(err){
      res.status(422).send(err);
    });
  }else{
    res.send({blocks: blocks})
  }
}

router.get('/block',function(req, res, next){
  if(req.query.number){
    network.blocks(parseInt(req.query.number)).then(function(queRes){
          res.send(queRes)
        }).catch(function(err){
          res.status(422).send(err);
        });
  }else{
    res.status(422).send({message:"Block number is required", status: 0});
  }
})




module.exports = router;
