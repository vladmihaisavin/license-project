const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
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

    //TODO: test
    ipcMain.on('change-safety-setting', (event, props) => {
        project.safety.actionTimeout = props.actionTimeout;
    });

    ipcMain.on('change-drive-mode', (event, props) => {
        project.driveMode = props.driveMode;
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