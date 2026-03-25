const express=require('express')
const router=express.Router()
const {auth,isAdmin,isUser}=require('../middlewares/auth')
const {getAllUsers,deleteUser,deleteTask,updateTask,createNewTask}=require('../controllers/adminController')

router.get('/getAllUsers',auth,isAdmin,getAllUsers) //get all users
router.delete('/deleteUser/:id',auth,isAdmin,deleteUser)  //delete user by id
router.post('/createNewTask',auth,isAdmin,createNewTask) //create new task
router.delete('/deleteTask/:id',auth,isAdmin,deleteTask) //delete task
router.patch('/updateTask/:id',auth,isAdmin,updateTask) //update task




module.exports=router