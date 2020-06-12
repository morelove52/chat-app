const socket = io()

//elements
const $formMessage = document.querySelector('#form-message')
const $formInput = document.querySelector('#form-input')
const $formSubmitBtn = document.querySelector('#form-submit')
const $sendLocationBtn = document.querySelector('#send-location')
const $messages = document.querySelector('#message')
const $sidebar = document.querySelector('#sidebar')

//template
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessage = document.querySelector('#location-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    
    const html = Mustache.render($messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (msg) => {
    const html = Mustache.render($locationMessage, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$formMessage.addEventListener('submit', (e) => {
    e.preventDefault()

    $formSubmitBtn.setAttribute('disabled', 'disabled')

    const message = $formInput.value

    socket.emit('sendMesage', message, (message) => {
        $formSubmitBtn.removeAttribute('disabled')
        $formInput.value = ''
        $formInput.focus()

        console.log(message)
    })
})

$sendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('share location is not supported by your browser')
    }

    $sendLocationBtn.setAttribute('disabled', 'disbled')

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, () => {
            console.log('Shared Location')
            $sendLocationBtn.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href('/')
    }
})