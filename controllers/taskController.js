const Task = require('../models/task')
const getAllTasks=async(req,res,next)=>{
    try{
        const tasks=await Task.find({})
     
        //check if tasks array is empty ie task not found
        if(tasks.length===0){
            const error=new Error('No Tasks found')
            error.code=404
            throw error
        }

        res.json({
            status:'success',
            Tasks:tasks
        })
        }


    catch(error){
        next(error)
    }
}



module.exports={getAllTasks}