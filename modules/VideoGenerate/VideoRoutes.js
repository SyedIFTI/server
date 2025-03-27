const express = require('express')
const { generate, downloadVideo } = require('./VidoeController')
const { userAuth } = require('../../middleware/AuthMiddleware')
const router= express.Router()

router.post('/generate',userAuth,generate)
router.post('/download',downloadVideo)

module.exports = router