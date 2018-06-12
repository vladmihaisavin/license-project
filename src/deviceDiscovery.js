let noble = require('noble');

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    console.log('Periferic descoperit (' + peripheral.id +
        ' adresă <' + JSON.stringify(peripheral.address) +  ', ' + peripheral.addressType + '>,' +
        ' conectabil ' + peripheral.connectable + ',' +
        ' RSSI ' + peripheral.rssi + ':');
    console.log('<br>Nume:');
    console.log(peripheral.advertisement.localName);

    let serviceData = peripheral.advertisement.serviceData;
    if (serviceData && serviceData.length) {
        console.log('<br>Date de serviciu:');
        for (let i in serviceData) {
            console.log(JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
        }
    }
    if (peripheral.advertisement.manufacturerData) {
        console.log('<br>Date producător:');
        console.log(JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
    }
    if (peripheral.advertisement.txPowerLevel !== undefined) {
        console.log('<br>Nivel TX:');
        console.log(peripheral.advertisement.txPowerLevel);
    }
});

