const lights = require('./lightsController');

const handbrake = (ollie, speed) => {
    ollie.setRawMotors({
        lmode: 0x03,
        lpower: 255,
        rmode: 0x03,
        rpower: 255
    }, () => {
        console.log("break");
        setTimeout(() => {
            stopEngines(ollie);
        }, 2000);
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

const shutDownOllie = (project) => {
    handbrake(project.ollie, project.speed);
    project.ollie.disconnect(() => {
        process.exit(0);
    });
};

const getDirection = (currentPalmPosition, referencePalmPosition) => {

    /** If no boundary is crossed, that means that the robot will stop */
    let command = {
        name: "BRAKE",
        lmode: 0x00,
        rmode: 0x00
    };

    /** Initial position minus current position => how much the hand moved on a certain axis (X or Y)*/
    let xDiff = referencePalmPosition[0] - currentPalmPosition[0];
    let zDiff = referencePalmPosition[2] - currentPalmPosition[2];

    if(xDiff > 20) {
        command = {
            name: "LEFT",
            lmode: 0x02,
            rmode: 0x01
        };
    } else if(xDiff < -20) {
        command = {
            name: "RIGHT",
            lmode: 0x01,
            rmode: 0x02
        };
    } else if(zDiff > 20) {
        command = {
            name: "FORWARD",
            lmode: 0x01,
            rmode: 0x01
        };
    } else if(zDiff < -20) {
        command = {
            name: "REVERSE",
            lmode: 0x02,
            rmode: 0x02
        };
    }

    return command;
};

const rawMove = (ollie, command, speed) => {
    ollie.setRawMotors({
        lmode: command.lmode,
        lpower: speed,
        rmode: command.rmode,
        rpower: speed
    }, () => {
        console.log(command.name);
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
};

/** Ollie goes to sleep if nothing happens for 60 seconds */
const setInactivityTimeout = (project, timeout) => {

    project.ollie.setInactivityTimeout(timeout, function(err, data) {
        console.log(err || "data: " + require('util').inspect(data, false, null));
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

module.exports = {
    handbrake,
    shutDownOllie,
    getDirection,
    getSpeed,
    rawMove,
    calibrateOrb,
    initiateCollisionDetection,
    setInactivityTimeout,
    startBatteryMonitor
};