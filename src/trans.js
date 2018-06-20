const langObject = {
    ro: {
        "LEFT": "Stânga",
        "RIGHT": "Dreapta",
        "FORWARD": "Înainte",
        "REVERSE": "Înapoi",
        "UP": "Sus",
        "DOWN": "Jos",
        "BRAKE": "Frână"
    },
    en: {
        "LEFT": "Left",
        "RIGHT": "Right",
        "FORWARD": "Forward",
        "REVERSE": "Reverse",
        "UP": "Up",
        "DOWN": "Down",
        "BRAKE": "Brake"
    }
};

const get = (lang, word) => {
    return langObject[lang][word];
};

module.exports = {
  get
};