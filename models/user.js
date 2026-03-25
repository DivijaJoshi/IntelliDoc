const mongoose=require('mongoose')
const validator = require('validator')

const user=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name required"],
        trim:true,
        match: [/^[A-Za-z\s]+$/,'Name should only contain alphabets and space.']
    },
    email:{
        type:String,
        required:[true,"Email required"],
        unique:true,
        lowercase:true,
        validate:[ validator.isEmail, 'Invalid email' ]

    },
    password:{
        type:String,
        required:[true,"Password required"]
    },
    role:{
        type:String,
        enum: {
        values: ['user', 'admin'],
        message: 'Role can only be user or admin'
    },
        
        default:'user'
    }

})

const User=mongoose.model('User',user)
module.exports=User