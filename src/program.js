const sphero = require("sphero");
const leapjs = require("leapjs");

class Program {
    constructor(config) {
        this.ollie = new sphero("ecbb7770577b43499810647044dd378a");
        this.controller = new leapjs.Controller({frameEventName:'deviceFrame', enableGestures:true});
        this.speed = 100;
        this.directions = {
            'FORWARD': 0,
            'RIGHT': 90,
            'REVERSE': 180,
            'LEFT': 270,
        };
        this.safety = {
            actionTimeout: 2000
        };
    }
}

module.exports = function program(config) {
    return new Program(config);
};

