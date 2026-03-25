const connectRabbit=require('../config/rabbitmq')
const Task=require('../models/task')

let channel

const Producer=async(taskId,roomId,inputs)=>{

const task=await Task.findById({_id:taskId})

    if(!task){
      const error = new Error('No Tasks found');
      error.code = 404;
      throw error;
    }

const message={
    taskId:task._id,
    taskName:task.taskName,
    inputs,
    roomId
}

//only if channel not already created then create channel
if(!channel){
 channel=await connectRabbit()
}

    await channel.assertQueue(task.queueName, { durable: true });
    channel.bindQueue(task.queueName, 'taskExchange', task.routingKey);
    
    //how many messages can be sent to a worker at once before acknowledgement of past message
    channel.prefetch(1,false); //Applies to individual consumers  

    channel.publish('taskExchange', task.routingKey, Buffer.from(JSON.stringify(message)))
    console.log(`${JSON.stringify(message)} published to queue with routing key ${task.routingKey} `);




}

module.exports=Producer