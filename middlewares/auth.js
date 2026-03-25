const jwt=require('jsonwebtoken')
const auth=(req,res,next)=>{
    try{
    const authHeader = req.headers.authorization; //returns "Bearer" token string


    //if "Bearer" token string absent, token not provided
    if (!authHeader) {
    const error = new Error("Access denied. No token provided.")
    error.code = 401
    throw error;

   
    }

    //extract token
    const token = authHeader.split(' ')[1];

    //if token not present throw error
    if (!token) {
        const error = new Error("Access denied. Invalid token format.")
        error.code = 401
        throw error;
      
    }

    //verify the token using seccret key
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    //store user info in request object
    req.user = decoded;

    next();
}
catch(error){
    next(error)
}

}

const Roles=['admin','user']

const isAdmin=(req,res,next)=>{
    try{
    if(req.user.role!==Roles[0]){
        const error = new Error("Forbidden, Invalid role for admin route")
        error.code = 403
        throw error;
    }

    next()
    }catch(error){
    next(error)
}
}

const isUser=(req,res,next)=>{
    try{
    if(req.user.role!==Roles[1]){
        const error = new Error('Forbidden, Invalid role for user route')
        error.code = 403
        throw error;

    }
    next()
    }catch(error){
    next(error)
    }
}

module.exports={auth,isAdmin,isUser}