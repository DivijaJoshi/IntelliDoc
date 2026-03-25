const connectRabbit=require('../config/rabbitmq')
const Task=require('../models/task')

let channel


const Producer=async(taskId,roomId,inputs,customTask)=>{



//only if channel not already created then create channel
if(!channel){
 channel=await connectRabbit()
}


let routingKey
let message


if(customTask){

    routingKey='task.custom'


    message={
    isCustom:true,
    customTask,
    inputs,
    roomId
}

}

else{

const task=await Task.findById({_id:taskId})



    if(!task){
      const error = new Error('No Tasks found');
      error.code = 404;
      throw error;
    }

    routingKey=task.routingKey

 message={
    taskId:task._id,
    taskName:task.taskName,
    inputs,
    roomId
}

}


   

    channel.publish('taskExchange', routingKey, Buffer.from(JSON.stringify(message)))
    console.log(`${JSON.stringify(message)} published to queue with routing key ${routingKey} `);




}

module.exports=Producer