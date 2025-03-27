const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    select: false,
  },
  createdAt: { type: Date, default: Date.now },
  stripeCustomerId: { type: String, sparse: true }, // Removed unique: true
  subscriptionStatus: { type: String, default: 'trial' }, // trial, a ctive, inactive
  subscriptionPlan: { type: String, default: null }, // starter, pro, enterprise
  trialEndDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },   isAdmin: {
    type: Boolean,
    default: false,
  },
  avatar:{
type:String
  },
  googleId:{
type:String
  },
  isVerified :{
    type:Boolean,
    default: false
  },
  otp:{
    type: String,
    default: null
  },
  otpExpires:{
    type:Date,
    default:null
  },
resetPasswordOtp:{
  type:String,
  default:null
}
,
resetPasswordOtpExpires:{
  type:Date,
  default:null
}
,
imageGenerationCount: { type: Number, default: 0 }, // Track image generations
  imageGenerationLimit: { type: Number, default: 3 }, // Default limit for trial users
  videoGenerationCount: { type: Number, default: 0 }, // Track video generations
  videoGenerationLimit: { type: Number, default: 1 }, // Default limit for trial users
  facelessGenerationCount: { type: Number, default: 0 }, // Track image generations
  facelessGenerationLimit: { type: Number, default: 0 }, // Default limit for trial users
  scriptGenerationCount: { type: Number, default: 0 }, // Track video generations
  scriptGenerationLimit: { type: Number, default: 0 }, // Default limit for trial users

},{timestamps:true});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

const generateToken = (user ,res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWTSECRET, { expiresIn: "1h" });
  const maxageHours = 1;
    const maxAgeinMilliseconds = maxageHours * 60 * 60 * 1000;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV==='production',
      sameSite: process.env.NODE_ENV === 'production'?"none":"Lax",
      maxAge: maxAgeinMilliseconds,
    });
    return token
};

const UserModel = mongoose.model("User", userSchema);

module.exports = { UserModel, generateToken };