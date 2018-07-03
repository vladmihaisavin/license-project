const core = require('./coreFunctionality');
const trans = require('./trans');
const lights = require('./lightsController');

const addListener = (project, mainWindow) => {
    let referenceSetFlag = false;
    let direction;

    let start;
    let timeout = 1000;

    project.controller.on('frame', function(frame) {

        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.9) {
                core.shutDownOllie(project);
            }

            if(!referenceSetFlag && palmRespectsBoudaries(frame.hands[1].palmPosition)) {
                project.precisionPalmReference = frame.hands[1].palmPosition;
                referenceSetFlag = true;
            }

            project.speed = core.getSpeed(frame.hands[0]) / 2;
            if(project.precisionPalmReference !== undefined) {
                if(!start){
                    handleDirectionHand(frame.hands[1]);
                    start = Date.now();
                } else {
                    let currentDate = Date.now();
                    if(currentDate - start > timeout) {
                        handleDirectionHand(frame.hands[1]);
                        start = currentDate;
                    }
                }
            }

            try {
                mainWindow.webContents.send('leap-data', {
                    currentPalmPosition: frame.hands[1].palmPosition,
                    referencePalmPosition: project.precisionPalmReference,
                });
            } catch(error) {
                console.error(error);
            }
        }
    });

    project.ollie.setMotionTimeout(timeout);

    const handleDirectionHand = (hand) => {

        direction = core.getDirection(hand.palmPosition, project.precisionPalmReference);
        core.rawMove(project.ollie, direction, project.speed);

        lights.setDirectionLight(project.ollie, direction.name);
        mainWindow.webContents.send('ollie-data', { direction: trans.get("ro", direction.name), speed: project.speed});
    };
};

const palmRespectsBoudaries = (palmPosition) => {
    return palmPosition[0] > 40 && palmPosition[0] < 80
        && palmPosition[1] > 130 && palmPosition[1] < 170
        && palmPosition[2] > 20 && palmPosition[2] < 60;
};

module.exports = {
    addListener
};