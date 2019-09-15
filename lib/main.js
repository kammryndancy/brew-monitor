const config = require('../config/config.json');
const express = require('express');
// const ecobee = require('./ecobee.js');
const sensor = require('./sensor.js');
const brewFriend = require('./brewFriend.js');
const log4js = require('log4js').configure('./config/logger.json');
const logger = log4js.getLogger('mainApplication');
// const _ = require('lodash');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// function round_to_precision(x, precision) {
//     var y = +x + (precision === undefined ? 0.5 : precision/2);
//     return y - (y % (precision === undefined ? 1 : +precision));
// }

app.get('/ambientTempC', (req, res) => {
    logger.info('Received request for /ambientTempC');
    sensor.getAmbientTemp().then((response) => {
        res.json({temp: response});
    }, (error) => {
        res.json(error);
    });
});

app.get('/sensors', (req, res) => {
    logger.info('Received request for /sensors');
    sensor.getSensorList().then((response) => {
        res.json({sensors: response});
    }, (error) => {
        res.json(error);
    });
});

app.get('/brewSession', (req, res) => {
    logger.info('Received request for /brewSession');
    brewFriend.getBrewSessions().then((response) => {
        res.json(response);
    }, (error) => {
        logger.error('Error occured getting brew sessions');
        res.json(error);
    });
});

app.get('/fermentation/:brewSessionId', (req, res) => {
    logger.info('Received request for /fermentation');
    brewFriend.setFermentationMonitor(req).then((response) => {
        res.sendStatus(200);
    }, (error) => {
        res.json(error);
    });
});

app.post('/apiKey/:brewFriendKey', (req, res) => {
    logger.info(`Received request for /apiKey`);
    brewFriend.setAPIKey(req).then((response) => {
        res.sendStatus(200);
    }, (error) => {
        res.json(error);
    });
});

// app.get('/thermostat', (req, res) => {
//     ecobee.thermostatData().then((response) => {
//         res.json(response);
//     }, (error) => {
//         res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
//     })
// });
//
// app.get('/ecobeePin', (req, res) => {
//     ecobee.ecobeePin().then((response) => {
//         res.json(response);
//     }, (error) => {
//         res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
//     })
// });
//
// app.get('/getTokens', (req, res) => {
//     ecobee.accessRefeshToken().then((response) => {
//         res.json(response);
//     }, (error) => {
//         res.json(error);
//     })
// });
//
// app.get('/refreshToken', (req, res) => {
//     ecobee.refreshCurrentToken().then((response) => {
//         res.json(response);
//     }, (error) => {
//         res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
//     });
// });
//
// app.get('/fermenterTemp', (req, res) => {
//     ecobee.thermostatData().then((response) => {
//         let sensorIndex = _.findIndex(response.thermostatList[0].remoteSensors, { id: 'rs:100'});
//         let sensor = response.thermostatList[0].remoteSensors[sensorIndex];
//         let rawTemp = sensor.capability[_.findIndex(sensor.capability, { id: '1' })].value;
//         console.log(round_to_precision((rawTemp - 320) * 5 / 90, 0.5) + 'C');
//         res.send(round_to_precision((rawTemp - 320) * 5 / 90, 0.5) + 'C');
//     }, (error) => {
//         res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
//     })
// });

app.get('/', (req, res) => {
    logger.info('Reached landing page');
    res.json({ reached: 'Got to the landing page'});
});

app.listen(config.port);