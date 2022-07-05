const express = require('express');
const app = express();
const mongoose = require ('mongoose');
const path = require('path');
require('dotenv/config')
//const userRoute = require('./routes/user')
const cors = require('cors')
const multer = require('./middleware/multer-config.js')

app.use(cors())



const userRouter = require('./routes/user');
const productRouter = require('./routes/myProducts')
const auth = require('./middleware/auth')


app.use(express.urlencoded({ extended : true }));
app.use(express.json());


app.use(express.static('public'))



mongoose.connect(process.env.MONGO_URI) //Conecting to mongo DB
  .then(() => {
    console.log('Successfully connected to MongoDB!');
  })
  .catch((error) => {
    console.log('Unable to connect to MongoDB Atlas!');
    console.error(error);
  });

app.use((req, res, next) => { //allowing request from any source
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});


  app.use('/', userRouter); // using userRouter
  app.use('/api/', auth, multer, productRouter)



  module.exports = app;
