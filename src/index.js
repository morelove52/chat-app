const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessages, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicdirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicdirectoryPath))

io.on('connection', (socket) => {
    console.log('New Connection to Websocket')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if(error) {
            callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessages('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessages(`${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('sendMesage', (msg, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessages(user.username, msg))
        callback('Delivered!')
    })

    socket.on('sendLocation', (location, callbck) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.longitude},${location.latitude}`))
        callbck()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessages(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up at ${port}`)
})