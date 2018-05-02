const keypress = require("keypress");

const startWithLeap = (project, mainWindow) => {

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
    project.controller.on('deviceConnected', function() {
        console.log('device connected');
    });
    project.controller.on('deviceDisconnected', function() {
        console.log('device disconnected');
    });
    // let n =0;
    project.controller.on('frame', function(frame) {
        // n++;
        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.95) {
                shutDownOllie(project.ollie);
            }

            if(frame.gestures.length) {

                // console.log("Gestures no: " + frame.gestures.length);
                // console.log("Gestures: " + frame.gestures);
                // console.log("Hands no: " + frame.hands.length);
                // console.log("Hands: " + frame.hands);
                // if(n % 100 === 0)
                // {
                mainWindow.webContents.send('leap-data', {
                    gestureNo: frame.gestures.length,
                    handNo: frame.hands.length,
                });
                // }
                let gesture = frame.gestures[0];

                if (gesture.type === 'swipe' && gesture.state ==='stop') {
                    handleSwipe(frame);
                }

            }
        }
    });

    const handleSwipe = function(frame) {

        let gesture = frame.gestures[0];
        let X = gesture.position[0] - gesture.startPosition[0];
        let Y = gesture.position[1] - gesture.startPosition[1];
        let Z = gesture.position[2] - gesture.startPosition[2];

        let aX = Math.abs(X);
        let aY = Math.abs(Y);
        let aZ = Math.abs(Z);
        let big = Math.max(aX, aY, aZ);
        let direction;

        if (aX === big) {
            direction = 'RIGHT';
            if (X < 0) {
                direction = 'LEFT';
            }
        } else if (aY === big) {
            direction = 'UP';
            if (Y < 0) {
                direction = 'DOWN';
            }
        } else if (aZ === big) {
            direction = 'REVERSE';
            if (Z < 0) {
                direction = 'FORWARD';
            }
        }

        switch (direction) {
            case 'UP':
                //shutDownOllie(project.ollie);
                calibrateOrb(project.ollie);
                return;
            case 'DOWN':
                handbrake(project.ollie);
                return;
            case 'FORWARD':
            case 'RIGHT':
            case 'REVERSE':
            case 'LEFT':
                direction = project.directions[direction];
                break;
            default:
                return;

        }

        let leftHand = frame.hands[0];
        project.speed = getSpeed(leftHand);

        project.ollie.roll(project.speed, direction);
        setTimeout(() => {
            handbrake(project.ollie);
        }, project.safety.actionTimeout);
        mainWindow.webContents.send('ollie-data', { direction: direction, speed: project.speed});
    };
    project.controller.connect();
    console.log('waiting for Leap Motion connection...');
};

const startWithKeyboard = (project) => {
    let direction = 0;
    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        console.log('got "keypress"', key);
        if (key.ctrl && key.name === 'c') {
            shutDownOllie(project.ollie);
        }
        if(key.ctrl && key.name === "a") {
            calibrateOrb(project.ollie);
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
                handbrake(project.ollie);
                return;
        }
        project.ollie.roll(speed, direction);
        setTimeout(() => {
            project.ollie.roll(0, direction);
        }, 1000);
    });
};

const handbrake = (ollie) => {
    ollie.setRawMotors({
        lmode: 0x03,
        lpower: 0,
        rmode: 0x03,
        rpower: 0
    }, () => {
        console.log("break");
        setTimeout(() => {
            stopEngines(ollie);
        }, 500);
    });
};

const stopEngines = (ollie) => {
    ollie.setRawMotors({
        lmode: 0x00,
        lpower: 0,
        rmode: 0x00,
        rpower: 0
    }, () => {
        console.log("engines stopped");
    });
};

const calibrateOrb = (ollie) => {
    handbrake(ollie);
    ollie.startCalibration();
    setTimeout(() => {
        ollie.finishCalibration();
    }, 5000);
};

const shutDownOllie = (ollie) => {
    handbrake(ollie);
    ollie.disconnect(() => {
        process.exit(0);
    });
};

const getSpeed = (leftHand) => {
    /** Max speed is 255 (0xFF), optimum low height for palmPosition is 100 */
    let leftHandHeight = leftHand.palmPosition[1];
    if(leftHandHeight < 100) {
        return 0;
    } else if(leftHandHeight > 355) {
        return 255;
    } else {
        return leftHandHeight - 100;
    }
};

module.exports = {
    startWithLeap,
    startWithKeyboard
};