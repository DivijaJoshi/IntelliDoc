const express=require('express')
const upload=require('../config/multer')
const router=express.Router()
const {auth,isAdmin,isUser}=require('../middlewares/auth')
const{runTask,updateProfile}=require('../controllers/userController')


router.post('/ai-task-run/:id',auth,isUser,upload.single('file'),runTask) //run a task or 
//custom task with ai-task-run/others


router.patch('/updateProfile',auth,isUser,updateProfile) //update user profile


module.exports=router