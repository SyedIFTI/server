const verifyOtp = (req,res,next)=>{
    const {otp} = req.body
    if(!otp){
        const message = "Otp is missing"
        const status = 400
        const error = {
            message,
            status
        }
        return next(error)
    }

}