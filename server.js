const express = require('express')

const app = express()
const server = require('http').Server(app)
const { v4:uuidv4 } = require('uuid')
const io = require('socket.io')(server)

//peer
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {debug: true})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use('/peerjs', peerServer)

app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

app.get('/:room', (req, res) => {
    if(req.params.room != 'leave'){
        res.render('room', {roomID: req.params.room});
    } else {
        res.render('leave');
    }
})

io.on('connection', (client) => {
    client.on('join-room', (roomID, userID) => {
        console.log('room id: ' + roomID);
        console.log('user id: ' + userID);
        client.join(roomID);
        client.to(roomID).emit('user-connected', userID);

        client.on('call-from', userID => {
            // console.log('call from user: ' + userID);
            client.to(roomID).emit('user-call', userID);
        })
    
        client.on('disconnect', () => {
            console.log('user disconnected: ' + userID);
            client.to(roomID).emit('user-disconnected', userID);
        })
    })
})

let PORT = process.env.PORT || 8080
server.listen(PORT, () => console.log('http://localhost:' + PORT))

