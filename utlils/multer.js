const multer = require('multer')
const path = require('path')
const fs = require('fs');
const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null, path.join(__dirname, '../public/VideoImages'))
    },
    filename: (req, file, cb) => {
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname)); 
      },
});
const upload = multer({ storage : storage });

// Ensure the 'uploads' folder exists

// if (!fs.existsSync('../public/productImages')) {
//   fs.mkdirSync('../public/productImages');
// }
module.exports = upload