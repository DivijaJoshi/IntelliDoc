const User = require('../models/user')
const Task = require('../models/task')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const {ai}=require('../config/gemini')
const Producer=require('../producers/producer')
const mongoose = require('mongoose')
const path = require('path');
const fs=require('fs')


//set globally as reused
const allowedFileTypesObject={
            '.pdf':'file',
            '.jpg':'image',
            '.jpeg':'image',
            '.png':'image',
            '.docx':'file'}

        const mimeTypes={
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

        }




//store inputs and taskID to call producer after user joined the room
let taskObj={}


//function to call producer after joinRoom socket event emitted
const startTask=async(roomId,socket)=>{

    //extract taskId and inputs here {taskId,inputs}
    const taskDetails=taskObj[roomId]
    console.log('Task details:',taskDetails)
    if(!taskDetails){
        //emit error event
        //if user sends wrong roomid then taskDetails would be empty and uninitialised
        return socket.emit('taskError','Task not found or already executed')
    }
        
    
    //after task details extracted delete task from taskObj to prevent double calls to producer
    //or delete task details after every execution
    delete taskObj[roomId]

    if(taskDetails.isCustom){
        await Producer(null,roomId,taskDetails.input,taskDetails.customTask)

    }

    else{
    await Producer(taskDetails.taskId,roomId,taskDetails.input,null)
    }
    
}



//function to process inputs as logic being reused to run both custom task and existing task
const processInputs=async(req)=>{

    const {textContent} = req.body

        

    let filePath
        if(req.file){
            filePath=req.file.path
        }

    //validate user input
    if (textContent && req.file) {
        const error = new Error('Only one of textContent or filePath is allowed')
        error.code = 400
        throw error
    }

    if (!textContent && !req.file) {
        const error = new Error('atleast one of textContent or filePath is needed')
        error.code = 400
        throw error
        }


        let type='text' //initially set type as text
        let mimeType

        

        //if file path provided change type and set mimeType
        if(filePath){

            //extract extension of file to check filetype
            const extension=path.extname(req.file.originalname)

            if(!(extension in allowedFileTypesObject)){
            
                const error = new Error('Invalid extension, (only .pdf, .jpg, .jpeg, .png, .docx are allowed)');
                error.code = 400
                throw error
        }

        type=allowedFileTypesObject[extension] //set type as file or image
        mimeType=mimeTypes[extension]  //set mimetype for a type
    }


        let input

        if(type==='text'){
            input={
                type:'text',
                textContent
            }

        }

        else if(type==='file'||type==='image'){


            //upload files to gemini
            const myfile = await ai.files.upload({
            file: filePath,
            config: {mimeType},



  });


        fs.unlink(filePath,()=>{})  //delete from server after file uploaded

            //set inputs for createPartFromUri method of createUserContent
            input={
                type,
                Uri:myfile.uri,
                mimeType:myfile.mimeType
            }
        }

        return input

}





//function to return roomId and save task details in taskObj for a task to be executed 
const runTask = async (req, res, next) => {
    try {

        //check if request body is empty
        if (!req.body) {
            const error = new Error('Missing fields')
            error.code = 400
            throw error;

        }

        //get taskId from url
        const taskId = req.params.id

        let customFlag
        let input
        let customTask

        if(taskId==='others'){
            customFlag=true

        }



        //if user wants to send custom request

        if(customFlag){

        //check for extra fields in req.body
        const allowedFields = [ 'textContent','prompt','systemPrompt', 'examples']
        for (let key in req.body) {
            if (!allowedFields.includes(key)) {
                const error = new Error('Only textContent, prompt, systemPrompt, examples is allowed in request body')
                error.code = 400
                throw error;
            }
        }
        input=await processInputs(req)


        const {prompt,systemPrompt,examples}=req.body

        if(!prompt||!systemPrompt||!examples){
            const error = new Error('prompt, systemPrompt, examples are required in request body')
            error.code = 400
            throw error;
        }

        customTask={prompt,systemPrompt,
            examples:JSON.parse(examples)} //convert string to array



        }



        //if running task from db
        else{

        //validate mongoose format for taskId
        let isValid = mongoose.Types.ObjectId.isValid(taskId);
                        if(!isValid){
                            const error=new Error('Invalid Mongoose ObjectID')
                            error.code=400
                            throw error
                        }


        //find task by id
        const task = await Task.findById(taskId)

        //check if task exists or not
        if (!task) {
            const error = new Error('No task found with this id');
            error.code = 404
            throw error

        }

        //check for extra fields in req.body
        const allowedFields = [ 'textContent']
        for (let key in req.body) {
            if (!allowedFields.includes(key)) {
                const error = new Error('Only textContent is allowed in request body')
                error.code = 400
                throw error;
            }
        }
        input=await processInputs(req)
        

    }


        //generate roomId
        const roomId = uuidv4()

        //store details about a room : Which task running in this room with what inputs
        let isCustom;
        
        if(customFlag===true){
            taskObj[roomId]={
                customTask,input,
                isCustom:true
            }
            console.log(`Custom task with input ${JSON.stringify(input)} sent to queue`)
        }
        else{

        taskObj[roomId]={
            taskId,input,
            isCustom:false
        }
        console.log(`${taskId} with input ${JSON.stringify(input)} sent to queue`)
    }

        res.json({
            status:'success',
            message:'Task and inputs stored in taskObj, Join the room to run the task.',
            roomId
        })




    }
    catch (error) {
        next(error)
    }

}

const updateProfile = async (req, res, next) => {


        try {
            //check if request body is empty
            if (!req.body) {
                const error = new Error('Missing fields')
                error.code = 400
                throw error;

            }
            const userId = req.user._id

            const user = await User.findById(userId)

            //check if user exists or not
            if (!user) {
                const error = new Error('No user found with this id');
                error.code = 404
                throw error

            }

            if (req.body.role) {
                const error = new Error('You cannot update your role')
                error.code = 400
                throw error;

            }


            //check for extra fields in req.body
            const allowedFields = ['name', 'email', 'password']
            for (let key in req.body) {
                if (!allowedFields.includes(key)) {
                    const error = new Error('Only Name, email, password are allowed in request body')
                    error.code = 400
                    throw error;
                }
            }


            if(req.body.email && req.body.email!==user.email){
                const emailExists=await User.findOne({email:req.body.email})

                if(emailExists){
                    const error = new Error('email already exists, please set a different email.')
                    error.code = 400
                    throw error;
                }
            }


            //Validate password length if password provided in request body
            if (req.body.password && req.body.password.length < 6) {
                const error = new Error('Password should be at least 6 characters long')
                error.code = 400
                throw error;
            }


            let hashedPassword;

            if(req.body.password){
                hashedPassword = await bcrypt.hash(req.body.password, 10);
                
            }

            const updatedProfile = await User.findByIdAndUpdate(userId, {
                name: req.body.name ?? user.name,
                email: req.body.email ?? user.email,
                password: hashedPassword ?? user.password,

            })

            res.json({
                status: "success",
                message: "User profile updated successfully",
                data: {
                    user: updatedProfile
                }
            }
            )

        } catch (error) {
            next(error)
        }




}

module.exports = { runTask, updateProfile,startTask }