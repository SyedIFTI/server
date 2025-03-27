const  axios = require ( "axios");
const  fs = require( "fs");
const { imageservice, voiceservice, animationservice } = require("../../services/AigenServices");
const ffmpeg = require('fluent-ffmpeg');
const path = require("path");
const { UserModel } = require("../../models/UserModel");

module.exports.facelessvideo = async (req, res, next) => {
  try {
    const { script } = req.body;
    console.log(script);
    
    const {email} = req.user
    const user  = await UserModel.findOne({email})
    console.log(user)
if(!user){
  return next({message:"User not found"})
}

    if(user.subscriptionStatus==='trial'){
      return next({message:"Please Subscribe to unlock this feature"})
    }
    if(user.subscriptionStatus==='active' && user.facelessGenerationCount>=user.facelessGenerationLimit){
      return next({message:"You have reached Your Credits"})
    }
    if(user.subscriptionStatus==='inactive'){
      return next({message:"Your Susbcription is Over"})
    }  
    

    const imageUrl = await imageservice(script, next);
    const voiceStream = await voiceservice(script); 

    
    const voiceBuffer = await streamToBuffer(voiceStream);

  
    const videoUrl = await animationservice(imageUrl, voiceBuffer);

    console.log("Final Video URL:", videoUrl);
    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("Malformed URL: Invalid video URL");
    }
    const videoResponse = await axios({
      url: encodeURI(videoUrl),
      method: "GET",
      responseType: "arraybuffer",
    });


    const videoPath = path.join(__dirname, "temp_video.mp4");
    fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

    const audioPath = path.join(__dirname, "temp_audio.mp3");
    fs.writeFileSync(audioPath, voiceBuffer); // Ensure it's a Buffer

    const outputPath = path.join(__dirname, "output.mp4");
    ffmpeg()
    .input(videoPath) // Input Video
    .input(audioPath) // Input Audio
    .audioCodec("aac") // Ensure audio codec is AAC
    .videoCodec("libx264") // Ensure video codec is H.264
    .outputOptions([
      "-b:a 192k",         // Set audio bitrate (higher = better quality)
      "-af volume=2",      // Increase volume (2x)
      "-shortest",         // Trim to shortest duration
      "-movflags +faststart" // Optimize MP4 playback
    ])
    .save(outputPath) // Save Output File
    .on("end", () => {
      console.log("Faceless video generation complete.");
      res.sendFile(outputPath); // Send final video
    })
    .on("error", (err) => {
      console.error("FFmpeg Error:", err);
      return next({ message: "FFmpeg processing failed", status: 500 });
    }
 
  );
  user.facelessGenerationCount+=1
  await user.save()
  } catch (error) {
    console.error("Error generating faceless video:", error);
    return next({ message: "Failed to generate faceless video", status: 400 });
  }
};
// ✅ Helper Function to Convert Stream to Buffer
const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};


module.exports.downloadVideo = async (req, res, next) => {
  try {
    const videoPath = path.join(__dirname, "...", "output.mp4");
    if (!videoPath) {
      return res.status(404).json({ error: "Video file not found" });
    }

    
    res.setHeader("Content-Disposition", `attachment; filename="output.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    
    res.sendFile(videoPath);
  } catch (err) {
    console.error("Backend error:", err);
    return next({ statusCode: 500, message: "Failed to download video" });
  }
};

