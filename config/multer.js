const multer=require('multer')
const path=require('path')
const {v4: uuidv4} = require('uuid')


const storage=multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4()+"--"+file.originalname);
    }
})


const fileFilter=(req,file,cb)=>{
    const allowed=['.pdf','.jpg','.jpeg','.png','.docx']
    const extension=path.extname(file.originalname)

    if(allowed.includes(extension)){
        cb(null,true)
    }
    else cb(new Error('file type not allowed'),false)

}

const upload=multer({storage,fileFilter,limits: {
        fileSize: 5 * 1024 * 1024}})


module.exports=upload