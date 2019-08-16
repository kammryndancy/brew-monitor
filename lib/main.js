const config = require('../config/config.json');
const express = require('express');
const monitor = require('./monitor.js');
const sensor = require('./sensor.js');
const _ = require('lodash');
const app = express();

function round_to_precision(x, precision) {
    var y = +x + (precision === undefined ? 0.5 : precision/2);
    return y - (y % (precision === undefined ? 1 : +precision));
}

app.get('/ambientTempC', (req, res) => {
    sensor.getAmbientTemp().then((response) => {
        res.json({temp: response});
    }, (error) => {
        res.json(error);
    });
});

app.get('/thermostat', (req, res) => {
    monitor.thermostatData().then((response) => {
        res.json(response);
    }, (error) => {
        res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
    })
});

app.get('/ecobeePin', (req, res) => {
    monitor.ecobeePin().then((response) => {
        res.json(response);
    }, (error) => {
        res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
    })
});

app.get('/getTokens', (req, res) => {
    monitor.accessRefeshToken().then((response) => {
        res.json(response);
    }, (error) => {
        res.json(error);
    })
});

app.get('/refreshToken', (req, res) => {
    monitor.refreshCurrentToken().then((response) => {
        res.json(response);
    }, (error) => {
        res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
    });
});

app.get('/fermenterTemp', (req, res) => {
    monitor.thermostatData().then((response) => {
        let sensorIndex = _.findIndex(response.thermostatList[0].remoteSensors, { id: 'rs:100'});
        let sensor = response.thermostatList[0].remoteSensors[sensorIndex];
        let rawTemp = sensor.capability[_.findIndex(sensor.capability, { id: '1' })].value;
        console.log(round_to_precision((rawTemp - 320) * 5 / 90, 0.5) + 'C');
        res.send(round_to_precision((rawTemp - 320) * 5 / 90, 0.5) + 'C');
    }, (error) => {
        res.json({ errorCode: error.statusCode, errorMessage: error.statusMessage });
    })
});

setInterval(() => {
    console.log(`Getting fermentor data`);
    monitor.thermostatData().then((response) => {
        let sensorIndex = _.findIndex(response.thermostatList[0].remoteSensors, { id: 'rs:100'});
        let sensor = response.thermostatList[0].remoteSensors[sensorIndex];
        let rawTemp = sensor.capability[_.findIndex(sensor.capability, { id: '1' })].value;
        console.log(round_to_precision((rawTemp - 320) * 5 / 90, 0.5) + 'C');
    }, (error) => {
        console.log(`Error retrieving fermenter data: ${error}`);
    })
}, 3600 * 1000);

app.listen(config.port);