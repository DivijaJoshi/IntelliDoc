const Task=require('../models/task')

const {geminiCall} = require('../config/gemini')
const {getio}=require('../config/socket') 


const ConsumerWorker=async(channel,queue)=>{
    
    
        
    console.log('Worker listening to queue',queue)

    //consume queue passed by workerManager
    channel.consume(queue, async(msg) => {


        //if message not found stop further execution
        if(!msg) return


    //Message format:
    // taskId:task._id,
    // taskName:task.taskName,
    // inputs {stores type,
                // Uri:myfile.uri,
                // mimeType:myfile.mimeType}
    // roomId


    //extract the message and store: ie convert buffer to String to Json object for destructuring
    const {taskId,taskName,inputs,roomId,isCustom,customTask}=JSON.parse(msg.content.toString())

    const io=getio() //get websocket server instance

    if(isCustom){
        const existingTasks=await Task.find({}).select('_id taskName description')
        const result=await geminiCall(customTask, inputs,existingTasks)

        let output=''

        //process output in chunks and send to room
        for await (const chunk of result){
            output+=chunk.text
            io.to(roomId).emit("taskChunk",chunk.text)
        }

        console.log("Gemini call result:",output)


         //after complete chunks sent, send final output
        io.to(roomId).emit("done",output)

    }
    
    else{
    const task=await Task.findById({_id:taskId})
            
        if(!task){
          const error = new Error('No Tasks found');
          error.code = 404;
          throw error;
        }
        
       


        //call gemini api with task and inputs
        const result=await geminiCall(task,inputs,null)
        let output=''

        //process output in chunks and send to room
        for await (const chunk of result){
            output+=chunk.text
            io.to(roomId).emit("taskChunk",chunk.text)

        }

        console.log("Gemini call result:",output)

        //after complete chunks sent, send final output
        io.to(roomId).emit("done",output)

    }

        


        //acknowldge that message is processed and delete from queue(prevent redelivery)
        channel.ack(msg)

        

        })





}

module.exports=ConsumerWorker