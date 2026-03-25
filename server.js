require('dotenv').config();
const http=require('http')
const express = require('express')
const {startTask}=require('./controllers/userController')
const authRoutes=require('./routes/authRoutes')
const adminRoutes=require('./routes/adminRoutes')
const userRoutes=require('./routes/userRoutes')
const taskRoutes=require('./routes/taskRoutes')
const WorkerManager = require('./workers/workerManager')
const connectDb = require('./config/mongodb')
const connectRabbit = require('./config/rabbitmq')
const errorHandler = require('./middlewares/errorHandler')
const app = express()
const {websocketSetup}=require('./config/socket') 

//create server instance to inititalise socket.io
const server=http.createServer(app)

app.use(express.json())
let io=websocketSetup(server)

//listen to connection event
io.on('connection',(socket)=>{
    console.log('user connected',socket.id)

    //listener for when user joins a room 
    socket.on('joinRoom',async(roomId)=>{
        socket.join(roomId)
        console.log('Joined task room-',roomId)
        //start task only after user joins room
        await startTask(roomId,socket)

    })

    //event listener for when task already executed or user joins invalid roomid
    socket.on('taskError',(msg)=>{
        console.log(msg)
    })


    socket.on('disconnect',()=>{
        console.log('user disconnected')
    })
})



connectDb(process.env.MONGO_URL).then(() => {
    console.log('MongoDb connected')
    //used closure so rabbitmq and server starts only after mongodb connected
    return connectRabbit()

}).then(async (channel) => {
    console.log('RabbitMQ connected')

    //call WorkerManger to scale workers
    await WorkerManager(channel)

    //mount routes
    app.use('/api/auth',authRoutes)
    app.use('/api/user',userRoutes)
    app.use('/api/admin',adminRoutes)
    app.use('/api/tasks',taskRoutes)


    // invalid routes middleware
    app.use((req,res,next)=>{
        const error=new Error('Route not found')
        error.code=404
        throw error
    
})
    //mount error handler middleware
    app.use(errorHandler)

    //start server
    server.listen(process.env.PORT, () => {
            console.log('Server Started at port', process.env.PORT)
    })
    
}).catch((err) => console.log(err))





