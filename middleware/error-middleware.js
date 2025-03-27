const errormiddleware = (err,req,res,next)=>{
const status = err.status || 500
const message = err.message || "Server Error"
const extraDetails = err.extraDetails || 'Error from Server'
return res.status(status).json({message,extraDetails})  
}
module.exports = errormiddleware