const express = require('express')
const { facelessvideo, downloadVideo } = require('./FacelessVideoController')
const multer = require("multer");
const { userAuth } = require('../../middleware/AuthMiddleware');
const upload = multer();
const router = express.Router()

router.post('/generate',userAuth,facelessvideo)
router.get('/download',downloadVideo)

module.exports = router