const directionLights = {
    "LEFT": "yellow",
    "RIGHT": "yellow",
    "FORWARD": "green",
    "REVERSE": "white",
    "BRAKE": "red",
};

let intermittent = undefined;

const partyLights = (ollie) => {

    setInterval(() => {
        ollie.randomColor();
    }, 500);
};

const setLight = (ollie, color) => {

    ollie.color(color);
    if(intermittent !== undefined) {
        clearInterval(intermittent);
    }
};

const setIntermittentLight = (ollie, color, interval) => {
    let flag = 0;
    const colors = ["black", color];
    intermittent = setInterval(() => {
        ollie.color(colors[flag % 2]);
        flag++;
    }, interval);
};

const setDirectionLight = (ollie, directionName) => {
    switch(directionName) {
        case "LEFT":
        case "RIGHT":
            setIntermittentLight(ollie, directionLights[directionName], 500);
            break;
        case "FORWARD":
        case "REVERSE":
        case "BRAKE":
            setLight(ollie, directionLights[directionName]);
            break;
        default:
            break;
    }
};

module.exports = {
    partyLights,
    setLight,
    setDirectionLight
};