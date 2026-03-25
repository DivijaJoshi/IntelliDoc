const{Server}=require('socket.io')
let io
const websocketSetup=(server)=>{
        io=new Server(server)
    return io

}
const getio=()=>{
    return io
}

module.exports={websocketSetup,getio}