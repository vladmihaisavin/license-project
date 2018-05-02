const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let mainWindow;

const program = require("./src/program");
const project = new program({});

const ollieController = require('./src/ollieController');
const keyListener = new window.keypress.Listener();

function createMainWindow() {
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
}

function renderMainWindow() {

    createMainWindow();

    ipcMain.on('stop-app', (event, props) => {
        if(project.ollie && project.controller)
        {
            project.ollie.disconnect(function() {
               console.log('disc');
            });
            project.controller.disconnect();
        }
        mainWindow.webContents.send('ollie-status', { color: "red", status: "Disconnected" });
    });

    ipcMain.on('start-app', (event, props) => {
        console.log('start app');
        project.ollie.connect(function () {
            mainWindow.webContents.send('ollie-status', { color: "green", status: "Connected" });

            //project.ollie.detectCollisions();

            ollieController.startWithKeyboard(project, keyListener);
            //ollieController.startWithLeap(project, mainWindow);

            // /** On collision, ollie should shut down */
            // project.ollie.on("collision", function(data) {
            //     console.log("I crashed like this:");
            //     console.log("  x:", data.x);
            //     console.log("  y:", data.y);
            //     console.log("  z:", data.z);
            //     console.log("  axis:", data.axis);
            //     console.log("  xMagnitud:", data.xMagnitud);
            //     console.log("  yMagnitud:", data.yMagnitud);
            //     console.log("  speed:", data.timeStamp);
            //     console.log("  timeStamp:", data.timeStamp);
            //     handbrake(project.ollie);
            // });
            //
            // /** Ollie goes to sleep if nothing happens for 60 seconds */
            // project.ollie.setInactivityTimeout(60, function(err, data) {
            //     console.log(err || "data: " + data);
            // });

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