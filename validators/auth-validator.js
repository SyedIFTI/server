const {z} = require('zod')
//object Schema
const SignUpSchema = z.object({
    name : z.string({required_error:"Name is required"}).trim().min(3,{message:"Name must be at least of 3 characters"})
    .max(20,{message:"Name must not be more than 20 cahracters"}),
email:z.string({required_error:"Email is required"}).trim().email({message:"Invalid email address"}),
password:z.string({required_error:"Password is required"}).min(8,{message:"Password must be at least 8 characters long"}),
confirmpassword: z.string({ required_error: "Confirm Password is required" }),
})
module.exports = SignUpSchema