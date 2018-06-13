Controlul unui robot Sphero Ollie cu ajutorul unui dispozitiv Leap Motion
Lucrare de licență
Student: Savin Vlad-Mihai, AC - TI - 1406A
Profesor Coordonator: Ungureanu Florina


Pași pentru configurarea proiectului:
1. Instalarea dispozitivului Leap Motion pe sistemul de operare ales de dvs.
2. 1. rularea comenzii `npm install` și apoi `npm run` SAU
2. 2. Instalarea cu ajutorul executabilului sau a dmg-ului.

Pentru a descoperi dispozitivele bluetooth din jurul dumneavoastră, rulați comanda<br>
`node ./node_modules/noble/examples/advertisement-discovery.js`

Pentru a crea installer de MacOS, rulați comenzile:<br>
`CXX=clang++ electron-packager .`<br>
`CXX=clang++ electron-installer-dmg Proiect\ Licență-darwin-x64/Proiect\ Licență.app/ licentaInstaller`
