const {z} = require('zod')

const resetpasswordSchema = z.object({
    email:z.string({required_error:"Email is required"}).trim().email({message:"Invalid email address"}),
        otp: z.string({
          required_error: "OTP is required",
        })
        .length(4, {
          message: "Invalid OTP, must be exactly 4 numbers",
        })
        .regex(/^\d+$/, {
          message: "OTP must contain only numbers",
        }),
          password:z.string({required_error:"Password is required"}).min(8,{message:"Password must be at least 8 characters long"}),
          confirmpassword:z.string({required_error:"Confirm Password is required"}).min(8,{message:"Password must be at least 8 characters long"})

})
module.exports = resetpasswordSchema