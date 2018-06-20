const core = require('./coreFunctionality');
const directions = {
    'FORWARD': 0,
    'RIGHT': 90,
    'REVERSE': 180,
    'LEFT': 270,
};

const addListener = (project, mainWindow) => {

    const handleSwipe = function(frame) {

        let gesture = frame.gestures[0];
        let X = gesture.position[0] - gesture.startPosition[0];
        let Y = gesture.position[1] - gesture.startPosition[1];
        let Z = gesture.position[2] - gesture.startPosition[2];

        let aX = Math.abs(X);
        let aY = Math.abs(Y);
        let aZ = Math.abs(Z);
        let big = Math.max(aX, aY, aZ);
        let direction;

        if (aX === big) {
            direction = 'RIGHT';
            if (X < 0) {
                direction = 'LEFT';
            }
        } else if (aY === big) {
            direction = 'UP';
            if (Y < 0) {
                direction = 'DOWN';
            }
        } else if (aZ === big) {
            direction = 'REVERSE';
            if (Z < 0) {
                direction = 'FORWARD';
            }
        }

        switch (direction) {
            case 'UP':
                core.calibrateOrb(project);
                return;
            case 'DOWN':
                core.handbrake(project.ollie, project.speed);
                return;
            case 'FORWARD':
            case 'RIGHT':
            case 'REVERSE':
            case 'LEFT':
                direction = directions[direction];
                break;
            default:
                return;
        }

        let leftHand = frame.hands[0];
        project.speed = core.getSpeed(leftHand);

        project.ollie.roll(project.speed, direction);

        setTimeout(() => {
            core.handbrake(project.ollie, project.speed);
        }, project.safety.actionTimeout);

        mainWindow.webContents.send('ollie-data', { direction: direction, speed: project.speed});
    };

    project.controller.on('frame', function(frame) {

        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.9) {
                core.shutDownOllie(project);
            }

            if(frame.gestures.length) {

                mainWindow.webContents.send('leap-data', {
                    gestureNo: frame.gestures.length,
                    handNo: frame.hands.length,
                });

                let gesture = frame.gestures[0];

                if (gesture.type === 'swipe' && gesture.state ==='stop') {
                    handleSwipe(frame);
                }

            }
        }
    });
};

module.exports = {
    addListener
};