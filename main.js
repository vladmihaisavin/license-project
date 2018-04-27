const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let mainWindow;

const sphero = require("sphero");
const leapjs = require("leapjs");
const keypress = require("keypress");

const ollie = new sphero("ecbb7770577b43499810647044dd378a");
const controller = new leapjs.Controller({frameEventName:'deviceFrame', enableGestures:true});

let speed = 100;
const directions = {
    'FORWARD': 0,
    'RIGHT': 90,
    'REVERSE': 180,
    'LEFT': 270,
};

const safety = {
    actionTimeout: 2000
};

function renderMainWindow() {

    //TODO: Refactor (build mainWindow object in function)
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        title: 'Proiect Licență',
        show: false
    });

    mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'));
    mainWindow.openDevTools({
        mode: 'bottom'
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
    require('./menu/mainmenu');

    ipcMain.on('stop-app', (event, props) => {
        if(ollie && controller)
        {
            ollie.disconnect(function() {
               console.log('disc');
            });
            controller.disconnect();
        }
        mainWindow.webContents.send('ollie-status', { color: "red", status: "Disconnected" });
    });

    ipcMain.on('start-app', (event, props) => {
        console.log('start app');
        ollie.connect(function () {
            mainWindow.webContents.send('ollie-status', { color: "green", status: "Connected" });

            ollie.detectCollisions();

            //controlOllieKeypress(ollie);
            controlOllieLeap(ollie, controller, mainWindow);

            /** On collision, ollie should shut down */
            ollie.on("collision", function(data) {
                console.log("I crashed like this:");
                console.log("  x:", data.x);
                console.log("  y:", data.y);
                console.log("  z:", data.z);
                console.log("  axis:", data.axis);
                console.log("  xMagnitud:", data.xMagnitud);
                console.log("  yMagnitud:", data.yMagnitud);
                console.log("  speed:", data.timeStamp);
                console.log("  timeStamp:", data.timeStamp);
                handbrake(ollie);
            });

            /** Ollie goes to sleep if nothing happens for 60 seconds */
            ollie.setInactivityTimeout(60, function(err, data) {
                console.log(err || "data: " + data);
            });

            /** Should warn user and power off ollie if low battery */
            // setInterval(function() {
            //     ollie.getPowerState(function(err, data) {
            //         if (err) {
            //             console.log("error: ", err);
            //         } else {
            //             console.log("data:");
            //             console.log("  recVer:", data.recVer);
            //             console.log("  batteryState:", data.batteryState);
            //             console.log("  batteryVoltage:", data.batteryVoltage);
            //             console.log("  chargeCount:", data.chargeCount);
            //             console.log("  secondsSinceCharge:", data.secondsSinceCharge);
            //         }
            //     });
            // }, 2000);

            /** What should happen if BLE response is lost? */
        });
    });
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        renderMainWindow();
    }
});

app.on('ready', renderMainWindow);



const controlOllieLeap = (ollie, controller, mainWindow) => {

    controller.on('connect', function() {
        console.log('connected to leap motion');
    });

    controller.on('disconnect', function() {
        console.log('disconnected leap');
    });
    controller.on('protocol', function(p) {
        console.log('protocol', p);
    });
    controller.on('ready', function() {
        console.log('ready');
    });
    controller.on('deviceConnected', function() {
        console.log('device connected');
    });
    controller.on('deviceDisconnected', function() {
        console.log('device disconnected');
    });
    // let n =0;
    controller.on('frame', function(frame) {
        // n++;
        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.7) {
                shutDownOllie(ollie);
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
                //shutDownOllie(ollie);
                calibrateOrb(ollie);
                return;
            case 'DOWN':
                handbrake(ollie);
                return;
            case 'FORWARD':
            case 'RIGHT':
            case 'REVERSE':
            case 'LEFT':
                direction = directions[direction];
                break;
            default:
                return;

        }

        let leftHand = frame.hands[0];
        speed = getSpeed(leftHand);

        ollie.roll(speed, direction);
        setTimeout(() => {
            handbrake(ollie);
        }, safety.actionTimeout);
        mainWindow.webContents.send('ollie-data', { direction: direction, speed: speed});
    };
    controller.connect();
    console.log('waiting for Leap Motion connection...');
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
