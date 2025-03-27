const axios =  require('axios')
const fetch = require('node-fetch');
const fs = require('fs');
const { LumaAI } = require('lumaai');
const { UserModel } = require('../../models/UserModel');

const client = new LumaAI({ authToken: process.env.LUMAAI_API_KEY });

module.exports.generate = async (req, res , next) => {
  try {
    const {email} = req.user

    const user = await UserModel.findOne({email})
    if(!user){
      return next({message:"User not found",status:400})
    }
    // console.log(user);
    
    if(user.subscriptionStatus==='trial' && Date.now()>user.trialEndDate){
      return next({message:"Your Trail period is over. Please Susbscribe!"})
    }
    if(user.subscriptionStatus==='trial'&& user.videoGenerationLimit<=user.videoGenerationCount){
      return next({message:"You have reached your trail generation limit.Please Subscribe"})
    }
    if(user.subscriptionStatus==='active' && user.videoGenerationCount>=user.videoGenerationLimit){
      return next({message:"You have reached Your Credits"})
    }
    if(user.subscriptionStatus==='inactive'){
      return next({message:"Your Susbcription is Over"})
    }
    const {description, videoDuration, agegroup, platform , gender } = req.body;

    console.log("Received Request:", {description, videoDuration, agegroup, platform ,gender});
    if(!description || !videoDuration || !agegroup || !platform || !gender){
        return next({message:"Fill all the fields properly!",status:400})
    }

    const formatDuration =(videoDuration)=> {
      return videoDuration.replace(/\s*seconds?\s*/i, 's');
  }
  const Duration = formatDuration(videoDuration);
console.log(Duration);

  const prompt = `${description}. This video is intended for ${platform||'youtube'} and should be suitable for ${agegroup||'young'} audiences.for specific gender:${gender ||"male"}`;
    
let generation = await client.generations.create({
  prompt: `${prompt}`,
  model: "ray-2",
  duration : Duration
});

let completed = false;

while (!completed) {
  generation = await client.generations.get(generation.id);

  if (generation.state === "completed") {
      completed = true;
  } else if (generation.state === "failed") {
      throw new Error(`Generation failed: ${generation.failure_reason}`);
  } else {
      console.log("Dreaming...");
      await new Promise(r => setTimeout(r, 3000)); 
  }
}

const videoUrl = generation.assets.video;
user.videoGenerationCount+=1
await user.save()
const response = await fetch(videoUrl);
// const fileStream = fs.createWriteStream(`${generation.id}.mp4`); to store video in server
// await new Promise((resolve, reject) => {
//   response.body.pipe(fileStream);
//   response.body.on('error', reject);
//   fileStream.on('finish', resolve);
// });

// console.log(`File downloaded as ${generation.id}.mp4`);
 return res.json({ message: "Video generated successfully!", videoUrl });  
  } catch (error) {
    console.error("Error generating video:", error);
    return next({message:"Failed to generate the video"})
  }
};



module.exports.downloadVideo = async (req, res, next) => {
  try {
    const { VideoUrl } = req.body;
    console.log("Received Video URL:", VideoUrl);

    if (!VideoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Stream the video instead of loading it entirely into memory
    const response = await axios.get(VideoUrl, {
      responseType: 'stream',
    });

    res.setHeader('Content-Disposition', `attachment; filename="video.mp4"`);
    res.setHeader('Content-Type', response.headers['content-type']);

    // Pipe the video data directly to the response
    response.data.pipe(res);
  } catch (err) {
    console.error('Error downloading video:', err.message);
    res.status(500).json({ error: 'Failed to download video' });
  }
};  