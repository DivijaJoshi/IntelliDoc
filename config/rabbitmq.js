const amqp = require('amqplib');
const Task = require('../models/task');

const connectRabbit = async () => {

    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const exchange = 'taskExchange';


    //create direct exchange
    await channel.assertExchange(exchange, 'direct', { durable: true });

    const tasks = await Task.find({});
    

    channel.prefetch(1,false);
    for (const task of tasks) {
      await channel.assertQueue(task.queueName, { durable: true });
      channel.bindQueue(task.queueName, exchange, task.routingKey);
      
      
      console.log(`Queue bound: ${task.queueName} -> ${task.routingKey}`);
    }


    
    return channel;

 
};

module.exports = connectRabbit