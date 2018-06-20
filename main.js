const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sphero = require('sphero');
let mainWindow, deviceDiscoveryWindow;

const program = require("./src/program");
const project = new program({});

const ollieController = require('./src/ollieController');
const core = require('./src/coreFunctionality');

function createWindows() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        title: 'Proiect Licență',
        show: false
    });

    mainWindow.loadURL('file://' + path.join(__dirname, '/index.html'));
    // mainWindow.openDevTools({
    //     mode: 'bottom'
    // });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    });

    mainWindow.on('closed', function () {
        mainWindow = null
    });

    deviceDiscoveryWindow = new BrowserWindow({frame: false,
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        show: false,
        parent: mainWindow
    });

    deviceDiscoveryWindow.loadURL('file://'  + path.join(__dirname, '/windows/device-discovery.html'));

    // deviceDiscoveryWindow.openDevTools({
    //     mode: 'bottom'
    // });

    require('./menu/mainmenu');
}

function renderMainWindow() {

    createWindows();

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

            if(props.device === "leap")
            {
                ollieController.startWithLeap(project, mainWindow);
            } else {
                ollieController.startWithKeyboard(project);
            }

            core.initiateCollisionDetection(project);
            core.setInactivityTimeout(project, 60);
            core.startBatteryMonitor(project, 10000, mainWindow);

        });
    });

    ipcMain.on('change-settings', (event, props) => {
        project.safety.actionTimeout = props.safetyActionTimeout;
        project.ollie = new sphero(props.deviceId);
    });

    ipcMain.on('change-drive-mode', (event, props) => {
        project.driveMode = props.driveMode;
    });

    let discoverDevicesCommand;
    ipcMain.on('open-device-discovery-window', (event, props)=> {
        deviceDiscoveryWindow.show();
        const spawn = require('child_process').spawn;
        discoverDevicesCommand = spawn('node', ['src/deviceDiscovery.js']);

        discoverDevicesCommand.stdout.on('data', function (data) {
            deviceDiscoveryWindow.webContents.send("device-discovery-data", {content: data.toString()});
        });
    });

    ipcMain.on('close-device-discovery-window', (event, props)=> {
        deviceDiscoveryWindow.hide();
        discoverDevicesCommand.kill();
    });
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        renderMainWindow();
    }
});

app.on('ready', renderMainWindow);