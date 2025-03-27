const express = require('express')
const { register, login, googleSignin, verifyAccount, resendOtp, logout, forgetpassword, resetpassword } = require('./UserAuthController')
const { userAuth } = require('../../middleware/AuthMiddleware')
const validate  = require('../../middleware/validate-middleware')
const SignUpSchema = require ('../../validators/auth-validator')
const LoginSchema  =  require('../../validators/login-validator')
const { UserModel } = require('../../models/UserModel')
const resetpasswordSchema = require('../../validators/resetpassword-validator')
const router = express.Router()

router.post('/signup', validate(SignUpSchema) ,register)
router.post('/login',validate(LoginSchema),login)
router.post('/googleAuth',googleSignin)
router.post('/verify',userAuth,verifyAccount)
router.post('/resend-otp',userAuth,resendOtp)
router.post('/logout',logout)
router.post('/forgetpassword',forgetpassword)
router.post('/resetpassword',validate(resetpasswordSchema),resetpassword)

router.get('/checkAuthroute',userAuth,async(req,res)=>{
    const userData = req.user   
    res.json({ message: 'You are authenticated', user: userData });
})
module.exports = router