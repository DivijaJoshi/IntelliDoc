const Task=require('../models/task')
const ConsumerWorker=require('./worker')


const WorkerManager=async(channel)=>{

    //store queue name and worker count
    let defaultWorkers={}
    
    const minWorkers=1 //set min workers running to initialise for each queue
    const maxWorkers=4  //set max workers that are allowed 
    
    const interval=10000 //10 seconds

    //run every 10 seconds to check for new tasks to start new worker or scale
    setInterval(async ()=>{

        //check if task exists in db
        const tasks=await Task.find({})
        if(tasks.length===0){
            console.log('No task found')
            return
        }

        //iterate over each task
        for(let task of tasks){
            
            //if any TaskQueue worker count is uninitialised ie undefined
            //  (as initially defaultWorkers is empty)
            // then set inital worker as minWorkers
            if(!defaultWorkers[task.queueName]){

                //create and bind queue in case new task added at any time
                // (finds new task first as runs every 10 seconds)

                    await channel.assertQueue(task.queueName, { durable: true });
                    channel.bindQueue(task.queueName,'taskExchange', task.routingKey);

                    //how many messages can be sent to a worker at once before acknowledgement of past message
                    channel.prefetch(1,false); //Applies to individual consumers

                    //update defaultWorkers with 1 worker for each queue intially
                    defaultWorkers[task.queueName]=minWorkers

                    //start initial worker
                    ConsumerWorker(channel, task.queueName)
                    console.log(`initial Worker started for ${task.queueName}`)
                }
            
                

            //for each queue find count of messages in queue to scale workers
            const messageCount=await channel.checkQueue(task.queueName)

            //assume 1 worker can handle 2 tasks without very long wait times
            if(messageCount>defaultWorkers[task.queueName]*2)
                if(defaultWorkers[task.queueName]<maxWorkers) 
                    //keep worker count under a threshold value
            {
                //scale and add more workers
                ConsumerWorker(channel, task.queueName)
                defaultWorkers[task.queueName]++ //increment count of worker by 1
                console.log(`More workers added for ${task.queueName} with message count ${messageCount}`)

                }
    }

    },interval)
    

}

module.exports=WorkerManager