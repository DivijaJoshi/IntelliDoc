const express=require('express')
const router=express.Router()
const {auth,isAdmin,isUser}=require('../middlewares/auth')
const{runTask,updateProfile}=require('../controllers/userController')

router.post('/ai-task-run/:id',auth,isUser,runTask) //run a task
router.patch('/updateProfile',auth,isUser,updateProfile) //update user profile


module.exports=router