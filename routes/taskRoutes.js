const express=require('express')
const router=express.Router()
const {auth,isAdmin,isUser}=require('../middlewares/auth')
const {getAllTasks}=require('../controllers/taskController')

router.get('/getAllTasks',auth,getAllTasks)


module.exports=router