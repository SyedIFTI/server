const express = require('express')
const { generateImage, downloadImage } = require('./GenerateImgController')
const { userAuth } = require('../../middleware/AuthMiddleware')
const router= express.Router()

router.post('/generate',userAuth,generateImage)
router.post('/download',downloadImage)
module.exports=router