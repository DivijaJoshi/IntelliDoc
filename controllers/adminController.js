
const User=require('../models/user')
const Task=require('../models/task')
const mongoose=require('mongoose')



//View all Users (admin)
const getAllUsers=async (req,res,next)=>{
    try{
        //get all users
        const users=await User.find({}).select('-password')

        //check if users array is empty ie users not found
        if(users.length===0){
            const error=new Error('No users found')
            error.code=404
            throw error
        }

        res.json({
            status:'success',
            Users:users
        })
    }
    catch(error){
        next(error)
    }
}


//Delete user by id (admin)
const deleteUser=async (req, res, next)=>{
    try{

        
        const userId=req.params.id

        //validate mongoose userId format
        let isValid = mongoose.Types.ObjectId.isValid(userId);
                if(!isValid){
                    const error=new Error('Invalid Mongoose ObjectID')
                    error.code=400
                    throw error
                }
        
        
        const userFound=await User.findById(userId)

        //check if user exists or not
        if(!userFound){
            const error=new Error('No user found with this id');
            error.code=404
            throw error
            
        }
        
        //if user exists delete user by id
        const user=await User.findByIdAndDelete(userId)
        

        res.json({
            status:'success',
            message:'User deleted successfully'

        })
    }
    catch(error){
        next(error)
    }
}

const createNewTask=async(req,res,next)=>{
    try{
    
    //check if request body is empty
    if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }
    
    const {taskName,description,prompt,systemPrompt,examples,queueName,routingKey}=req.body

         //check for required fields
    if(!taskName||!description||!prompt ||!queueName||!routingKey||!systemPrompt||!examples ){
        const error=new Error('taskName,description,prompt,systemPrompt,examples,queueName,routingKey are required')
        error.code=400
        throw error;
    }


    //check for extra fields in req.body
    const allowedFields=['taskName','description','prompt','systemPrompt','examples','queueName','routingKey']
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only taskName,description,prompt,systemPrompt,examples,queueName,routingKey  are allowed in request body')
            error.code=400
            throw error;
        }
    }


    //check if taskName already exists
    const task=await Task.find({taskName:taskName})
    if(task.length===1){
        const error=new Error('Task by this Name already exists.')
        error.code=400
        throw error
    }

    
    //create new task
    const newtask=new Task({
        taskName,
        description,
        prompt,
        systemPrompt,
        examples,
        queueName,
        routingKey

    })
    await newtask.save()

    res.json({
        status:'success',
        message:'Task created successfully'
    })



    }catch(error){
        next(error)
    }
}

const deleteTask=async(req,res,next)=>{
    try{
        const taskId=req.params.id

        //validate mongoose taskId format
        let isValid = mongoose.Types.ObjectId.isValid(taskId);
                if(!isValid){
                    const error=new Error('Invalid Mongoose ObjectID')
                    error.code=400
                    throw error
                }
        
        
        const task=await Task.findById(taskId)

        //check if task exists or not
        if(!task){
            const error=new Error('No task found with this id');
            error.code=404
            throw error
            
        }
        
        //if task exists delete task by id
        const deletedTask=await Task.findByIdAndDelete(taskId)
        

        res.json({
            status:'success',
            message:'Task deleted successfully'

        })


    }catch(error){
        next(error)
    }
}


const updateTask=async(req,res,next)=>{
    try{

     //check if request body is empty
            if(!req.body){
                const error=new Error('Missing fields')
                error.code=400
                throw error;

    }


    const taskId=req.params.id //get task id from req.params


    //validate mongoose taskId format
        let isValid = mongoose.Types.ObjectId.isValid(taskId);
                if(!isValid){
                    const error=new Error('Invalid Mongoose ObjectID')
                    error.code=400
                    throw error
                }
        
        
        const task=await Task.findById(taskId)

        //check if task exists or not
        if(!task){
            const error=new Error('No task found with this id');
            error.code=404
            throw error
            
        }

        

        //check for extra fields in req.body
    
    const allowedFields=['taskName','description','prompt','systemPrompt','examples','queueName','routingKey']
    
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only taskName,description,prompt,systemPrompt,examples,queueName,routingKey  are allowed in request body')
            error.code=400
            throw error;
        }
    }
    
    //update details if provided using nullish coalescing operator
    const updatedTask=await Task.findByIdAndUpdate(taskId,{
        taskName:req.body.taskName??task.taskName,
        description:req.body.description??task.description,
        prompt:req.body.prompt??task.prompt,
        systemPrompt:req.body.systemPrompt??task.systemPrompt,
        examples:req.body.examples??task.examples,
        queueName:req.body.queueName??task.queueName,
        routingKey:req.body.routingKey??task.routingKey,
    })
        
        res.json({
            status:"success",
            message:"Task updated successfully",
            data:{
                task:updatedTask
            }
        }
        )
             
}catch(error){
        next(error)
    }
}



module.exports={getAllUsers,deleteUser,createNewTask,deleteTask,updateTask}