const { LumaAI } = require("lumaai");
const axios = require('axios');
const fs = require("fs");
const fetch = require("node-fetch");
const { UserModel } = require("../../models/UserModel");
const ImageModel = require("../../models/ImageModel");
require("dotenv").config();

const client = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY,
});

module.exports.generateImage = async (req, res,next) => {
  try {
    const {prompt} = req.body
    const {email} = req.user
const user  = await UserModel.findOne({email})
if(!user){
  return next({message:"User not found"})
}
if(user.subscriptionStatus==='trial' && Date.now()>user.trialEndDate){
  return next({message:"Your Trail period is over. Please Susbscribe!"})
}
if(user.subscriptionStatus==='trial'&& user.imageGenerationLimit<=user.imageGenerationCount){
  return next({message:"You have reached your trail generation limit.Please Subscribe"})
}
if(user.subscriptionStatus==='active' && user.imageGenerationCount>=user.imageGenerationLimit){
  return next({message:"You have reached Your Credits"})
}
if(user.subscriptionStatus==='inactive'){
  return next({message:"Your Susbcription is Over"})
}  

    let generation = await client.generations.image.create({prompt});
    while (generation.state !== "completed") {
      if (generation.state === "failed") {
        console.error("Generation failed:", generation.failure_reason);
        return res.status(500).json({ error: generation.failure_reason });
      }
      console.log("Generating image... waiting...");
      await new Promise((r) => setTimeout(r, 3000));
      generation = await client.generations.get(generation.id);
    }
    if (!generation.assets || !generation.assets.image) {
      return res.status(500).json({ error: "No image assets found from Luma API" });
    }
    const imageUrl = generation.assets.image;
     user.imageGenerationCount+=1
    
     await user.save()
    res.status(200).json({messgae:"Image is generated sucessfuly",imageUrl})
  } catch (error) {
    console.error(error);
    return next({ message: "Error in Image Generation", status: 400 });
  }
}
// to download the image in computer
module.exports.downloadImage = async (req, res, next) => {
  try {    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

  
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer', 
    });
    if (!response.data || response.status !== 200) {
      throw new Error('Failed to fetch image');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${imageUrl.split('/').pop()}"`);
    res.setHeader('Content-Type', response.headers['content-type']);

    res.send(response.data);
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).json({ error: 'Failed to download image' });
  }
};