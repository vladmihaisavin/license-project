const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sphero = require('sphero');
let mainWindow;

const program = require("./src/program");
const project = new program({});

const ollieController = require('./src/ollieController');

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

    mainWindow.on('closed', function () {
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

            if(props.device === "leap")
            {
                ollieController.startWithLeap(project, mainWindow);
            } else {
                ollieController.startWithKeyboard(project);
            }

            ollieController.initiateCollisionDetection(project);
            ollieController.setInactivityTimeout(project, 60);
            ollieController.startBatteryMonitor(project, 10000, mainWindow);

        });
    });

    ipcMain.on('change-settings', (event, props) => {
        project.safety.actionTimeout = props.safetyActionTimeout;
        project.ollie = new sphero(props.deviceId);
    });

    ipcMain.on('change-drive-mode', (event, props) => {
        project.driveMode = props.driveMode;
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