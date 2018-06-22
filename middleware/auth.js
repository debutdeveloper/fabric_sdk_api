var transactionUtils = require('./../application/utility/transaction_utils')

var jwt = require('jsonwebtoken');
var config = require('../configuration/config')
var auth = function verifyToken(req, res, next){
    if(req.url == "/user/login" 
    || (req.url == "/user/create" && req.method == "POST")
    || req.url == "/user/forget-password"){
        next()
    }else{
        var token = req.headers['authorization']
        //  console.log(token)
        jwt.verify(token,config.secret,function(err, decoded){
            if(err){
                res.status(401).send({message:"Please provide a valid authorization token.", status: 0})
            }else{
                req.user = decoded;
                
                //Get the user object for the supplied id
                getUser(req.user.id).then((user) =>{
                    //Status: 1=active, 0: Inactive
                    if(user.data.status==1)     //active
                        next()
                    else
                        res.status(401).send({FirstName: user.data.first_name, Last_Name:user.data.last_name, message:"You have been disabled by the admin"})
                }).catch((err) => {
                        res.status(500).send(err)
                })
            }1
        });
    }
}

module.exports = auth;


//function to fetch the user
function getUser(id){
	var functionName = 'getUser'
    var args = [id]
    
    return transactionUtils.prepareQuery(functionName, args)
}


