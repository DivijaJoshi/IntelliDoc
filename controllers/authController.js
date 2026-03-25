const jwt=require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const User=require('../models/user');



//function to generate a token (userid and role used for signing signature)
const generateToken= (user)=>{
    const token=jwt.sign({id:user._id,role:user.role},process.env.SECRET_KEY,{expiresIn:'1d'})
    return token
}


//Create new account (user/admin)
const signup=async (req,res,next)=>{

    try{

    //check if request body is empty
    if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }

    const { name,email, password, role } = req.body;
    
    //check for required fields
    if(!name||!email||!password ){
        const error=new Error('Name,email,password are required')
        error.code=400
        throw error;
    }


    //check for extra fields in req.body
    const allowedFields=['name','email','password','role']
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only Name, email, password, role are allowed in request body')
            error.code=400
            throw error;
        }
    }

    //Validate password length 
    if(password.length<6){
        const error=new Error('Password should be at least 6 characters long')
        error.code=400
        throw error;
    }   


    //check if user already exists
    const userExists=await User.findOne({email})

   
    if (userExists) {
        const error=new Error('User already exists,Please login.')
        error.code=400
        throw error;
    }


    //hash pw to store in db
    const hashedPassword = await bcrypt.hash(password, 10);

    //create new user
    const newUser=new User({name,email,password:hashedPassword,role})
    const SavedUser=await newUser.save()

    res.status(201).json({
        message:'User created successfully',
        token:generateToken(SavedUser)
    })

    }catch(error){
        next(error)
    }



}


//Login for existing accounts (user/admin)
const login=async (req,res,next)=>{
    try{

        //check if request body is empty
        if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }
        const {email,password}=req.body

         //check for required fields
        if(!email || !password){
            const error=new Error('Email and password are required')
            error.code=400
            throw error
        }

        const allowedFields=['email','password']
        for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only email, password are allowed in request body')
            error.code=400
            throw error;
        }
    }


        //Check if user exists by email or credentials are invalid
        const user=await User.findOne({email})
        if(!user){
            const error=new Error("Invalid Credentials")
            error.code=400
            throw error
        }


        //verify if password matches the stored password in db
        const passwordMatched=await bcrypt.compare(password,user.password)
        if(!passwordMatched){
            const error=new Error("Invalid Credentials, Password do not match")
            error.code=400
            throw error
        }

        res.json({
            success:true,
            message:'Login successful',
            token:generateToken(user),
            role:user.role
        })
        

    }
    catch(error){
        next(error)
    }
    
}

module.exports={signup,login}