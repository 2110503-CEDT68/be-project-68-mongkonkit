const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config({path:'./config/config.env'});

connectDB();

const app=express();
const hospitals = require('./routes/hospitals');
const appointments = require('./routes/appointments');
const auth = require('./routes/auth');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet=require('helmet');
const {xss}=require('express-xss-sanitizer');
const rateLimit=require('express-rate-limit');
const limiter=rateLimit({
    windowMs:10*60*1000,
    max: 100
});
const hpp=require('hpp');
const cors=require('cors');
const swaggerJsDoc=require('swagger-jsdoc');
const swaggerUI=require('swagger-ui-express');
const { url } = require("node:inspector");

app.use(express.json());
app.use(cookieParser());
app.set('query parser','extended');
app.use(
  mongoSanitize({
    replaceWith: '_'
  })
);
app.use(helmet());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());
app.use('/api/v1/hospitals',hospitals);
app.use('/api/v1/appointments',appointments);
app.use('/api/v1/auth',auth);

const swaggerOptions={
    swaggerDefinition:{
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1'
            }
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerDocs=swaggerJsDoc(swaggerOptions);
app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const PORT = process.env.PORT || 5000 ;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

process.on('unhandleRejection',(err,promise)=>{
    console.log(`Error: ${err.message}`);
    server.close(()=>process.exit(1));
});