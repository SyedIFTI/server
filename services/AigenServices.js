const axios = require('axios')
const ffmpeg = require("fluent-ffmpeg"); // For merging video and audio
const fs = require("fs");
const { LumaAI } = require("lumaai");
const RunwayML = require( '@runwayml/sdk');
const path = require('path')
const client = new LumaAI({
  authToken: process.env.LUMAAI_API_KEY,
});

const clientVideo = new RunwayML({
apiKey: process.env.RUNWAY_API_KEY
});
const imageservice = async (script) => {
  try {
    let generation = await client.generations.image.create({ prompt: script });
    while (generation.state !== "completed") {
      if (generation.state === "failed") {
        throw new Error("Image generation failed");
      }
      await new Promise((r) => setTimeout(r, 3000));
      generation = await client.generations.get(generation.id);
    }
    return generation.assets.image;
  } catch (error) {
    console.error(error);
    throw new Error("Error in Image Generation");
  }
};

const { Readable } = require("stream");

const voiceservice = async (script) => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128`,
      { text: script, model_id: "eleven_multilingual_v2" },
      {
        headers: { "xi-api-key": process.env.ELEVENLAB_API_KEY },
        responseType: "arraybuffer", // Get audio as buffer
      }
    );

    // Convert buffer to Readable Stream
    const audioStream = new Readable();
    audioStream.push(response.data);
    audioStream.push(null); // Signal end of stream

    return audioStream; // Return stream instead of buffer
  } catch (error) {
    console.error("Error generating voice:", error);
    throw new Error("Error in Voice Generation");
  }
};
const animationservice = async (imageUrl) => {
  try {
    const imageToVideo = await clientVideo.imageToVideo.create({
      model: "gen3a_turbo",
      promptImage: imageUrl,
    });

    let task;
    do {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      task = await clientVideo.tasks.retrieve(imageToVideo.id);
    } while (!["SUCCEEDED", "FAILED"].includes(task.status));

    if (task.status !== "SUCCEEDED") {
      throw new Error("Video generation failed");
    }

    console.log("Generated Video URL:", task.output); // Debugging

    // ✅ Extract the first URL if output is an array
    const videoUrl = Array.isArray(task.output) ? task.output[0] : task.output;

    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("Invalid video URL received");
    }

    return videoUrl; // ✅ Return valid URL
  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error("Error in Video Generation");
  }
};


module.exports = { imageservice, voiceservice, animationservice };
