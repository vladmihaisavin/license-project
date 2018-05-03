const keypress = require('keypress');
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
    project.controller.on('deviceConnected', function() {
        console.log('device connected');
    });
    project.controller.on('deviceDisconnected', function() {
        console.log('device disconnected');
    });

    if(project.driveMode === 'circuit')
    {
        addCircuitListener(project, mainWindow);
    } else if(project.driveMode === 'precision') {
        addPrecisionListener(project, mainWindow);
    }

    project.controller.connect();
    console.log('waiting for Leap Motion connection...');
};

const addCircuitListener = (project, mainWindow) => {

    project.controller.on('frame', function(frame) {

        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.9) {
                shutDownOllie(project);
            }

            if(frame.gestures.length) {

                mainWindow.webContents.send('leap-data', {
                    gestureNo: frame.gestures.length,
                    handNo: frame.hands.length,
                });

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
                calibrateOrb(project);
                return;
            case 'DOWN':
                handbrake(project.ollie, project.speed);
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
            handbrake(project.ollie, project.speed);
        }, project.safety.actionTimeout);

        mainWindow.webContents.send('ollie-data', { direction: direction, speed: project.speed});
    };
};

const addPrecisionListener = (project, mainWindow) => {

    let frameNo = 0;
    project.controller.on('frame', function(frame) {

        frameNo++;
        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.9) {
                shutDownOllie(project);
            }

            handleDirectionHand(frame.hands[1]);
        }
    });

    const handleDirectionHand = (hand) => {
        console.log(require('util').inspect(hand.palmPosition, false, null))
    };
};

const startWithKeyboard = (project) => {

    lights.setLight(project.ollie, 'green');
    let direction = 0;
    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        console.log('got "keypress"', key);
        if (key.ctrl && key.name === 'c') {
            shutDownOllie(project);
        }
        if(key.ctrl && key.name === "a") {
            calibrateOrb(project);
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
                handbrake(project.ollie, speed);
                return;
        }
        project.ollie.roll(speed, direction);
        setTimeout(() => {
            project.ollie.roll(0, direction);
        }, 1000);
    });
};

const handbrake = (ollie, speed) => {
    ollie.setRawMotors({
        lmode: 0x03,
        lpower: 255,
        rmode: 0x03,
        rpower: 255
    }, () => {
        console.log("break");
        setTimeout(() => {
            shortReverse(ollie, speed / 2);
        }, 1000);
    });
};

const shortReverse = (ollie, speed) => {
    ollie.setRawMotors({
        lmode: 0x02,
        lpower: speed,
        rmode: 0x02,
        rpower: speed
    }, () => {
        console.log("short reverse");
        setTimeout(() => {
            stopEngines(ollie);
        }, 250);
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

const calibrateOrb = (project) => {
    lights.partyLights(project.ollie);
    handbrake(project.ollie, project.speed);
    project.ollie.startCalibration();

    setTimeout(() => {
        project.ollie.finishCalibration();
        lights.setLight(project.ollie, 'green');
    }, 5000);
};

const shutDownOllie = (project) => {
    handbrake(project.ollie, project.speed);
    project.ollie.disconnect(() => {
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

/** On collision, ollie should shut down */
const initiateCollisionDetection = (project) => {

    project.ollie.detectCollisions();
    project.ollie.on("collision", function(data) {
        console.log("I crashed like this:");
        console.log("  x:", data.x);
        console.log("  y:", data.y);
        console.log("  z:", data.z);
        console.log("  axis:", data.axis);
        console.log("  xMagnitud:", data.xMagnitud);
        console.log("  yMagnitud:", data.yMagnitud);
        console.log("  speed:", data.timeStamp);
        console.log("  timeStamp:", data.timeStamp);
        handbrake(project.ollie);
    });

    //TODO: if mai mult de 2 secunde -> aceeasi pozitie -> event (blocat) -> go inapoi

};

/** Ollie goes to sleep if nothing happens for 60 seconds */
const setInactivityTimeout = (project, timeout) => {

    project.ollie.setInactivityTimeout(timeout, function(err, data) {
        console.log(err || "data: " + data);
    });
};

/** Should warn user if ollie has low battery */
const startBatteryMonitor = (project, interval, mainWindow) => {
    setInterval(function() {
        project.ollie.getPowerState(function(err, data) {
            if (err) {
                console.log("error: ", err);
            } else {
                console.log("data:");
                console.log("  recVer:", data.recVer);
                console.log("  batteryState:", data.batteryState);
                console.log("  batteryVoltage:", data.batteryVoltage);
                console.log("  chargeCount:", data.chargeCount);
                console.log("  secondsSinceCharge:", data.secondsSinceCharge);
            }
            if(data !== undefined && data.batteryState !== "Battery OK"){
                mainWindow.webContents.send('ollie-status', { color: "yellow", status: "Connected - Low battery" });
            }
        });
    }, interval);
};

/** What should happen if BLE response is lost? */
//TODO BLE lost

module.exports = {
    startWithLeap,
    startWithKeyboard,
    initiateCollisionDetection,
    setInactivityTimeout,
    startBatteryMonitor
};
