require('devtron').install();
const {ipcRenderer} = require('electron');


$(document).ready(() => {

    let leapData = null;

    let ollieStatus = document.getElementById('ollie-status');

    function startAppEvent(device) {
        ipcRenderer.send('start-app', {device: device});
    }

    function stopAppEvent() {
        ipcRenderer.send('stop-app', {});
    }

    function changeSettings(settings) {
        ipcRenderer.send('change-settings', settings);
    }

    function selectDriveMode(value) {
        ipcRenderer.send('change-drive-mode', {driveMode: value});
    }

    /** Run window */

    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('stop-button').classList.remove('hidden');
        document.getElementById('start-button').classList.add('hidden');
        document.getElementById('start-key-button').setAttribute('disabled', 'disabled');
        startAppEvent("leap");
    });

    document.getElementById('start-key-button').addEventListener('click', () => {
        document.getElementById('stop-key-button').classList.remove('hidden');
        document.getElementById('start-key-button').classList.add('hidden');
        document.getElementById('start-button').setAttribute('disabled', 'disabled');
        startAppEvent("keyboard");
    });

    document.getElementById('stop-button').addEventListener('click', () => {
        document.getElementById('start-button').classList.remove('hidden');
        document.getElementById('stop-button').classList.add('hidden');
        document.getElementById('start-key-button').removeAttribute('disabled');
        stopAppEvent();
    });

    document.getElementById('stop-key-button').addEventListener('click', () => {
        document.getElementById('start-key-button').classList.remove('hidden');
        document.getElementById('stop-key-button').classList.add('hidden');
        document.getElementById('start-button').removeAttribute('disabled');
        stopAppEvent();
    });

    /** Settings window */
    let modes = document.getElementsByClassName('mode-select');
    for(let mode of modes)
    {
        mode.addEventListener('click', () => {
            selectDriveMode(mode.getAttribute('data-mode'));
            console.log(mode.getAttribute('data-mode'));
        });
    }

    document.getElementById('save-changes').addEventListener('click', () => {

        let saveChangesButton = document.getElementById('save-changes');
        let deviceIdInput = document.getElementById('device-id');
        let safetyTimeoutSelect = document.getElementById('safety-timeout');
        let iconClasses = saveChangesButton.classList;

        //Make settings editable
        if(iconClasses.contains('fa-lock')) {
            iconClasses.remove('fa-lock');
            iconClasses.add('fa-unlock');
            saveChangesButton.setAttribute('title', 'Blochează pentru a salva modificările.');
            deviceIdInput.removeAttribute('disabled');
            safetyTimeoutSelect.removeAttribute('disabled');
        } else {
            //Save settings

            let settings = {};
            settings.safetyActionTimeout = safetyTimeoutSelect.value;
            settings.deviceId = deviceIdInput.value;

            changeSettings(settings);

            iconClasses.remove('fa-unlock');
            iconClasses.add('fa-lock');
            saveChangesButton.setAttribute('title', 'Deblochează pentru a face modificări.');
            deviceIdInput.setAttribute('disabled', 'disabled');
            safetyTimeoutSelect.setAttribute('disabled', 'disabled');
        }
    });

    ipcRenderer.on('ollie-status', (event, props) => {

        ollieStatus.innerHTML = props.status;
        ollieStatus.className = props.color;
    });

    ipcRenderer.on('ollie-data', (event, props) => {
        document.getElementById('ollie-data').innerHTML = "Direcție: " + props.direction + "<br>Viteză: " + props.speed;
    });

    ipcRenderer.on('leap-data', (event, props) => {
        leapData = props;
    });

    setInterval(function() {
        if(leapData === null) {
            return;
        }
        document.getElementById('ollie-data').innerHTML =
            "Număr de gesturi: " + leapData.gestureNo + "<br>" +
            "Număr de mâini: " + leapData.handNo + "<br>"
    }, 500);
});
