const {z} = require('zod')
//object Schema
const LoginSchema = z.object({
   email:z.string({required_error:"Email is required"}).trim().email({message:"Invalid email address"}),
password:z.string({required_error:"Password is required"}).min(8,{message:"Password must be at least 8 characters long"})
})
module.exports = LoginSchema