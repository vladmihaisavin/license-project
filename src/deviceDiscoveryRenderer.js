require('devtron').install();
const {ipcRenderer} = require('electron');


$(document).ready(() => {

    function closeDeviceDiscovery() {
        ipcRenderer.send('close-device-discovery-window', {});
    }

    document.getElementById('close-device-discovery').addEventListener('click', () => {
        closeDeviceDiscovery();
    });
});