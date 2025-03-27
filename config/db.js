const mongoose = require('mongoose')
const URL  = process.env.DBURL
const DbConnection = ()=>{
    mongoose.connect(URL).then(()=>{
        console.log("Connected with Database");
        
    }).catch((error)=>{
        console.log('Fail to Connect with Db',error);
        
    })
}
module.exports = DbConnection