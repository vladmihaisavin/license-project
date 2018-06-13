//require('devtron').install();
const {ipcRenderer} = require('electron');

$(document).ready(() => {

    function closeDeviceDiscovery() {
        ipcRenderer.send('close-device-discovery-window', {});
    }

    document.getElementById('close-device-discovery').addEventListener('click', () => {
        document.getElementById('device-info').innerHTML = "";
        closeDeviceDiscovery();
    });

    ipcRenderer.on('device-discovery-data', (event, props) => {
        document.getElementById('device-info').innerHTML += props.content;
    });
});