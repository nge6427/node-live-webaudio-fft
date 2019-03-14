const EventEmitter = require('events');
const http = require('http');
const serveStatic = require('serve-static');
const WebSocket = require('ws');

const config = {
    analyserOptions: {
        fftSize: 1024,
        smoothingTimeConstant: 0.0,
        minDecibels: -100,
        maxDecibels: 0
    },
    bufferSize: 1024
};

class LiveFFT extends EventEmitter {
    constructor(configOverride) {
        super();

        Object.assign(config, configOverride);

        const server = http.createServer((req, res) => {
            serveStatic(__dirname + '/listener')(req, res, () => {
                res.statusCode = 404;
                res.end();
            });
        })
        server.listen(9876);

        const wss = new WebSocket.Server({
            server: server
        });

        wss.on('connection', (ws) => {
            console.log('Connected...');
            ws.on('message', (data) => {
                this.emit('spectrum', data.slice(0, config.analyserOptions.fftSize / 2));
                this.emit('waveform', data.slice(config.analyserOptions.fftSize / 2));
            });

            ws.send(JSON.stringify(config));
        });

        console.log('Listening on http://localhost:9876/');
    }
}

module.exports = LiveFFT;
