const partyLights = (ollie) => {

    setInterval(() => {
        ollie.randomColor();
    }, 500);
};

const setLight = (ollie, color) => {

    ollie.color(color);
};

module.exports = {
  partyLights,
  setLight
};