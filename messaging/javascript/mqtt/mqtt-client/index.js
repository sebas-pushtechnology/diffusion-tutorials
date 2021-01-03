var mqtt = require('mqtt')
//var client = mqtt.connect('mqtt://test.mosquitto.org', {
var client = mqtt.connect('tcp://localhost:8086', {
    protocolVersion: 5,
    username: 'admin',
    password: 'password'
})

client.on('error', function (error) {
    console.log(error);    
})

client.on('connect', function () {
    client.subscribe('presence', function (err) {
        if (!err) {
            client.publish('presence', 'Hello mqtt from Diffusion')
        } else {
            console.log(err);
        }
    })
})

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString());
})