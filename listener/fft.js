var ws, config;
var connectWs = () => {
    connectWsButton.disabled = true;
    ws = new WebSocket("ws://localhost:9876/");

    ws.onopen = function() {
        wsStatus.innerHTML = "Connected";
    };

    ws.onmessage = function(message) {
        console.log(message)
        if (message.data === "sample" && config.sampleRate) {
            ws.send("" + config.sampleRate);
        } else if (!config) {
            config = JSON.parse(message.data);
            startFFTsButton.disabled = false;
            FFTStatus.innerHTML = "Not transmitting - ready";
        }
    };

    ws.onclose = function() {
        wsStatus.innerHTML = "Disconnected";
        connectWs();
    };
}

var startFFTs = () => {
    navigator.getUserMedia({
        audio: true
    }, (stream) => {
        var context = new AudioContext();

        var analyser = context.createAnalyser();
        Object.assign(analyser, config.analyserOptions);

        var spectrum = new Uint8Array(analyser.frequencyBinCount);
        var waveform = new Uint8Array(analyser.fftSize);
        var packet = new Uint8Array(analyser.fftSize + analyser.frequencyBinCount);

        var processor = context.createScriptProcessor(config.bufferSize, 1, 1);
        processor.onaudioprocess = () => {
            analyser.getByteFrequencyData(spectrum);
            analyser.getByteTimeDomainData(waveform);
            packet.set(spectrum);
            packet.set(waveform, spectrum.length);
            ws.send(packet);
        };

        var input = context.createMediaStreamSource(stream);
        input.connect(analyser);
        analyser.connect(processor);
        processor.connect(context.destination);

        config.sampleRate = analyser.sampleRate;
        ws.send("" + config.sampleRate);

        startFFTsButton.disabled = true;
        FFTStatus.innerHTML = "Transmitting data";
    }, (error) => {
        console.log(error);
    });
}

var connectWsButton = document.createElement('button');
connectWsButton.innerHTML = 'Connect WS';
connectWsButton.onclick = connectWs;
document.body.appendChild(connectWsButton);

var wsStatus = document.createElement('div');
wsStatus.innerHTML = "Disconnected";
document.body.appendChild(wsStatus);

var startFFTsButton = document.createElement('button');
startFFTsButton.innerHTML = 'Start FFTs';
startFFTsButton.disabled = true;
startFFTsButton.onclick = startFFTs;
document.body.appendChild(startFFTsButton);

var FFTStatus = document.createElement('div');
FFTStatus.innerHTML = "Not transmitting - awaiting config";
document.body.appendChild(FFTStatus);
