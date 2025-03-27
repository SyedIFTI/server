const { UserModel, generateToken } = require("../../models/UserModel");
const sendEmail = require("../../utlils/email");
const generateOtp = require("../../utlils/generate-otp");

module.exports.register = async (req, res ,next) => {
  const { name, email, password , confirmpassword} = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Account is already existed" });
    }    
    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Password is not matching" });
    }
const otp = generateOtp()
const otpExpires = Date.now()+ 24 * 60 * 60 * 1000

    const hashPassword = await UserModel.hashPassword(password);
    const AddUser = await UserModel.create({
      name,
      email,
      password: hashPassword,
      otp,
      otpExpires
    });
    try{
      await sendEmail({
        email:AddUser.email,
        subject : "OTP for email verification",
        html : `<h1>Your OTP is is : ${otp}</h1>`
      })
      const token = generateToken(AddUser,res);
      await AddUser.save({validateBeforeSave : false})
      res.status(200).json({ token, AddUser });
          }catch(err){
            const  message ="There is and error in sending email"
            const status = 500
            const error = {
              status,
             message
            }
     await UserModel.findByIdAndDelete(AddUser._id)
     return next(error)
          }
   
  
}
module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  if(!user.password){
    return res.status(400).json({ message: "Please SignIn from google" });
  }
  const comparePassword = await user.comparePassword(password);
  if (!comparePassword) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const token = await generateToken(user,res);
  // const maxageHours = 1;
  // const maxAgeinMilliseconds = maxageHours * 60 * 60 * 1000;
  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: maxAgeinMilliseconds,
  // });
  const UserData = {
    id:user._id,
    name:user.name,
    email:user.email
  }
  res.status(200).json({ token, user:UserData });
};

module.exports.googleSignin = async(req,res)=>{
const {name,email,avatar,googleId} = req.body
// console.log(req.body);

const user  = await UserModel.findOne({email})
if (!user) {
  const Createuser  = await UserModel.create({
    name,
    email,
    avatar,
    googleId,
    isVerified:true,
    })
const token = generateToken(Createuser,res)
return res.status(200).json({user,token})
}  

const token = generateToken(user,res)

return res.status(200).json({user,token})
}
module.exports.verifyAccount = async(req,res,next)=>{
  const {otp} = req.body//string  
  if(!otp){
      const message = "Otp is missing"
      const status = 400
      const error = {
          message,
          status
      }
      return next(error)
  }
  const user = req.user
  if(user.otp !== otp){
    return next({message:"Invalid Otp", status:400})
  }
  if(Date.now>user.otpExpires){
    return next({message:"Otp has expired.Please request a new OTP"})
  }
  
  user.isVerified=true,
  user.otp=undefined,
  user.otpExpires=undefined 
  await user.save({validateBeforeSave:false})
return res.status(200).json({message:"Email has been verified"})
}
module.exports.resendOtp = async(req,res,next)=>{
  const {email} = req.user
  if(!email){
    return next({message:"Email is required to resend OTP",status:400})
  }
  const user  = await UserModel.findOne({email})
  if(!user){
    return next({message:"User is not found",status:400})
  }
  if(user.isVerified){
    return next({message:"The Account is already verified",status:400})
  }
  const newotp= generateOtp()
  user.otp = newotp
  user.otpExpires = Date.now()+ 24 * 60 * 60 *1000
  await user.save({validatedBeforeSave:false})
  try {
    await sendEmail({
      email : user.email,
      subject : "Resend otp for email verification",
      html : `<h1>Your new Otp is ${newotp}</h1>`
    })
    res.status(200).json({message:"A new otp has sent to your email"})
  } catch (error) {
    user.otp = undefined
    user.otpExpires = undefined
    await user.save({validateBeforeSave:false})
return next({message:"There is an error in sending OTP.Please try again!",stauts:500})
  }
}
module.exports.logout = (req,res,next)=>{
  res.cookie("token","Loggedout",{
    expires: new Date(Date.now()+10*1000),
    httpOnly : true,
    secure : process.env.NODE_ENV === 'production'
  })
  res.status(200).json({message:"LoggedOut sucessfuly"})
}
module.exports.forgetpassword = async(req,res,next)=>{
const {email} = req.body
// console.log(email);

const user = await UserModel.findOne({email})
if(!user){
  return next({message:"Email is not found",status:400})
}
const otp = generateOtp()
user.resetPasswordOtp = otp
user.resetPasswordOtpExpires = Date.now()+300000 //5min
await user.save({validateBeforeSave:false})
try {
  await sendEmail({
    email : user.email,
    subject : "Reset Password OTP",
    html :`<h1>Your reset password OTP is ${otp}</h1>`
  })
  const token = generateToken(user,res)
  res.status(200).json({message:"Your reset password otp is send to your email",token})
} catch (error) {
  user.resetPasswordOtp = undefined
  user.resetPasswordOtpExpires = undefined
  await user.save({validateBeforeSave:false})
  return next ({message:"There is an error in sending otp .Please try again!",status:400})
}
}
module.exports.resetpassword = async(req,res,next)=>{
  const {email,otp,password,confirmpassword} = req.body
  // console.log(req.body);
  
  const user =await UserModel.findOne({
    email,
    resetPasswordOtp:otp,
    resetPasswordOtpExpires:{$gt: Date.now()}, //
  })
try {
  if(!user){
    return next({extraDetails:"No user found",status:400})
  }
 if(password!==confirmpassword){
  return next({message:"Password is not maching",status:400})
 }
 const hashpassword = await UserModel.hashPassword(password)
 user.password = hashpassword
 user.resetPasswordOtp = undefined
 user.resetPasswordOtpExpires =undefined
 await user.save({validateBeforeSave:false})
 res.status(200).json({message:"Password is Reset Sucessfuly"})
}catch (error) {
   user.resetPasswordOtp = undefined
user.resetPasswordOtpExpires = undefined
await user.save({validateBeforeSave:false})
return next({message:"An Error in reseting the password"})
}

}