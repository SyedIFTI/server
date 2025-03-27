const jwt= require('jsonwebtoken');
const { UserModel } = require('../models/UserModel');
module.exports.userAuth = async(req,res,next)=>{
    const token = req.cookies.token   || req.headers.authorization?.split('')[1]
    if(!token){
        return res.status(401).json({ message: 'Please login' });
    }
    try{
        const decoded = jwt.verify(token,process.env.JWTSECRET)
        const userData = await UserModel.findById(decoded.id)     
        if(!userData){
            return next({message:"Unauthorized token",stats:400})
        } 
        req.user = userData   
        next()
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
}