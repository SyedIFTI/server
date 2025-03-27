// const { UserModel } = require("../models/UserModel")

// const checkSubscription = async (req,res,next)=>{
// // const token =  req.cookies.token || req.headers.authorization?.split('')[1]
// const {email}  =  req.user
// const getUser = await UserModel.findOne({email})

// if(!getUser){
//  return next({message:"User not found",status:400})   
// }
// if(getUser.subscription.trialEndDate>=30){
//     getUser.subscription.status = 'inactive'
//     await getUser.save({validateBeforeSave: false})
//     return next({message:"Free trail is complete",status:400})
// }
// }
// module.exports = checkSubscription