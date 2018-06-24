const keypress = require('keypress');
const circuit = require('./circuit');
const precision = require('./precision');
const core = require('./coreFunctionality');
const lights = require('./lightsController');

const startWithLeap = (project, mainWindow) => {

    lights.setLight(project.ollie, 'green');

    project.controller.on('connect', function() {
        console.log('connected to leap motion');
    });

    project.controller.on('disconnect', function() {
        console.log('disconnected leap');
    });
    project.controller.on('protocol', function(p) {
        console.log('protocol', p);
    });
    project.controller.on('ready', function() {
        console.log('ready');
    });
    project.controller.on('streamingStarted', function() {
        console.log('device connected');
    });
    project.controller.on('streamingStopped', function() {
        console.log('device disconnected');
    });

    if(project.driveMode === 'circuit')
    {
        circuit.addListener(project, mainWindow);
    } else if(project.driveMode === 'precision') {
        precision.addListener(project, mainWindow);
    }

    project.ollie.stopOnDisconnect(function(err, data) {
        console.log(err || "data" + data);
    });

    project.controller.connect();
    console.log('waiting for Leap Motion connection...');
};

const startWithKeyboard = (project) => {

    lights.setLight(project.ollie, 'green');
    let direction = 0;
    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        console.log('got "keypress"', key);
        if (key.ctrl && key.name === 'c') {
            core.shutDownOllie(project);
        }
        if(key.ctrl && key.name === "a") {
            core.calibrateOrb(project);
            return;
        }
        let speed = 150;
        switch (key.name) {
            case 'right':
                direction = 90;
                break;
            case 'left':
                direction = 270;
                break;
            case 'up':
                direction = 0;
                break;
            case 'down':
                direction = 180;
                break;
            default:
                core.handbrake(project.ollie, speed);
                return;
        }
        project.ollie.roll(speed, direction);
        setTimeout(() => {
            project.ollie.roll(0, direction);
        }, 1000);
    });
};

module.exports = {
    startWithLeap,
    startWithKeyboard
};
