const sphero = require("sphero");
const leapjs = require("leapjs");

class Program {
    constructor() {
        this.ollie = new sphero("ecbb7770577b43499810647044dd378a");
        this.controller = new leapjs.Controller({frameEventName:'deviceFrame', enableGestures:true});
        this.speed = 100;
        this.precisionPalmReference = undefined;
        this.safety = {
            actionTimeout: 2000
        };
        this.driveMode = 'circuit';
    }
}

module.exports = function program(config) {
    return new Program(config);
};

