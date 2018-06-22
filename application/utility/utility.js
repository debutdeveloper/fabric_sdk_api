
//This function will create an error object
module.exports.createError = function(errors){
    return {status:0, message: errors[0].msg}
}