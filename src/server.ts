import express from 'express'
import http from 'http'
import mongoose from 'mongoose';
import {config} from './config/config';
import Logging from './library/logging';
import authorRoutes from './routes/Author'

const router = express()

// Connect to Mongo
mongoose.connect(config.mongo.url, {retryWrites: true, w: 'majority'})
    .then(() => {
        Logging.info('Connect to Mongo')
        StartServer()
    })
    .catch((error) => {
        Logging.error('Unable to connect: ')
        Logging.error(error)
    })

//Only start server
const StartServer = () => {
    router.use((req, res, next) => {
        //Log the Request
        Logging.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP:[${req.socket.remoteAddress}]`)
        res.on('finish', () => {
            //Log the Response
            Logging.info(`Incoming -> Method: [${req.method}] - Url: [${req.url}] - IP:[${req.socket.remoteAddress}]
            - Status: [${res.statusCode}]`)
        })
        next()
    })
    router.use(express.urlencoded({extended: true}))
    router.use(express.json())

    //Rules of our API
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Connect-Type, Accept, Authorization')

        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Method', 'PUT, POST, PATCH, DELETE, GET')
            return res.status(200).json({})
        }
        next()
    })

    //Routes
    router.use('/authors', authorRoutes)
    //Check
    router.get('/ping', (req, res, next) => res.status(200).json({message: 'pong'}))

    //Error
    router.use((req, res, next) => {
        const error = new Error('not found')
        Logging.error(error)

        return res.status(404).json({message: error.message})
    })

    http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`))
}