const mongoose=require('mongoose')

const task=new mongoose.Schema({
    taskName:{
    type: String,
    required:[true,"Task name required"],},

    description:{
        type:String,
        required:[true,"description required"],
    },
    prompt:{
        type:String,
        required:[true,"prompt required"],
    },
    systemPrompt:{
        type:String,
        default: 'You are a helpful Document helper AI Assistant. Think step by step and analyse the document.'
    },
    examples:[{
        input:String, //allow few shot prompting by storing array of examples
        output:String
}],
    
    queueName:{
        type:String,
        required:[true,"queueName required"],
    },
    routingKey:{
        type:String,
        required:[true,"routingKey required"],    }
})


const Task=mongoose.model('Task',task)

module.exports=Task