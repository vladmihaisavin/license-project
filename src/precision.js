const core = require('./coreFunctionality');
const trans = require('./trans');
const lights = require('./lightsController');

const addListener = (project, mainWindow) => {

    let frameNo = 0;
    let referenceSetFlag = false;
    let direction;

    project.controller.on('frame', function(frame) {

        frameNo++;
        if(frame.hands.length === 2) {

            if(frame.hands[0].grabStrength > 0.9) {
                core.shutDownOllie(project);
            }

            if(!referenceSetFlag && palmRespectsBoudaries(frame.hands[1].palmPosition)) {
                project.precisionPalmReference = frame.hands[1].palmPosition;
                referenceSetFlag = true;
            }

            project.speed = core.getSpeed(frame.hands[0]) / 2;
            if(frameNo % 10 === 0 && project.precisionPalmReference !== undefined) {
                handleDirectionHand(frame.hands[1]);
            }

            mainWindow.webContents.send('leap-data', {
                currentPalmPosition: frame.hands[1].palmPosition,
                referencePalmPosition: project.precisionPalmReference,
            });
        }
    });

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