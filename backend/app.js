const express = require('express');
const app = express();
const mongoose = require ('mongoose');
const path = require('path');
require('dotenv/config')
//const userRoute = require('./routes/user')
const cors = require('cors')
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('./middleware/multer-config.js')

// Inject defensive HTTP security headers with cross-origin access for uploaded media
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors())

// Express rate limiter for authentication & credential recovery endpoints (100 req / 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

const userRouter = require('./routes/user');
const productRouter = require('./routes/myProducts');
const categoryRouter = require('./routes/categories');
const marketplaceRouter = require('./routes/marketplace');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const driversRouter = require('./routes/drivers').router;
const telemetryRouter = require('./routes/telemetry').router;
const sensorsRouter = require('./routes/sensors').router;
const escrowRouter = require('./routes/escrow').router;
const routesRouter = require('./routes/routes');
const auth = require('./middleware/auth');


const mongoSanitize = require('./middleware/mongoSanitize');

app.use(express.urlencoded({ extended : true }));
app.use(express.json());

// Sanitize MongoDB queries against NoSQL injection
app.use(mongoSanitize);

// Apply rate limiting to sensitive authentication routes
app.use('/api/signup', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/resend-verification', authLimiter);
app.use('/verify', authLimiter);
app.use('/api/forgot-password', authLimiter);


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


  // Public category, marketplace, order, analytics, and driver routes
  app.use('/api', categoryRouter);
  app.use('/api', marketplaceRouter);
  app.use('/api', ordersRouter);
  app.use('/api', analyticsRouter);
  app.use('/api', driversRouter);
  app.use('/api/telemetry', telemetryRouter);
  app.use('/api/sensors', sensorsRouter);
  app.use('/api/escrow', escrowRouter);
  app.use('/api/routes', routesRouter);

  app.use('/', userRouter); // using userRouter
  app.use('/api/', auth, multer, productRouter)



  module.exports = app;
