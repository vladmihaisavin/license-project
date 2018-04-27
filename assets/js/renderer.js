require('devtron').install();
const {ipcRenderer} = require('electron');


$(document).ready(() => {

    let leapData = null;

    let ollieStatus = document.getElementById('ollie-status');

    function startAppEvent() {
        ipcRenderer.send('start-app', {});
    }

    function stopAppEvent() {
        ipcRenderer.send('stop-app', {});
    }

    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('stop-button').classList.remove('hidden');
        document.getElementById('start-button').classList.add('hidden');
        startAppEvent();
    });

    document.getElementById('stop-button').addEventListener('click', () => {
        document.getElementById('start-button').classList.remove('hidden');
        document.getElementById('stop-button').classList.add('hidden');
        stopAppEvent();
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
