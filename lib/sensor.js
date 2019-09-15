const sensor = require('ds18b20-raspi');
let log4js = require('log4js').configure('./config/logger.json');
const logger = log4js.getLogger('sensors');

function getAmbientTemp() {
    return new Promise((resolve, reject) => {
        sensor.readSimpleC(2, (err, temp) => {
            if (err) {
                logger.error(`Error occurred retrieving temperature from sensor: ${err.message}`);
                reject(err.message);
            } else {
                logger.info('Returning with current temp');
                resolve(temp);
            }
        });
    });
}

function getSensorList() {
    return new Promise((resolve, reject) => {
        sensor.list((err, deviceIds) => {
           if(err) {
               logger.error(`Error occurred retrieving list of sensors: ${err}`);
               reject(err);
           } else {
               logger.info(`Returning deviceIds`);
               resolve(deviceIds);
           }
        });
    });
}

module.exports = {
    getAmbientTemp,
    getSensorList
};