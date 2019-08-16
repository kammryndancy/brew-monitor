const sensor = require('ds18b20-raspi');

function getAmbientTemp() {
    return new Promise((resolve, reject) => {
        sensor.readSimpleC(2, (err, temp) => {
            if (err) {
                console.log(`Error occurred retrieving temperature from sensor: ${err.message}`);
                reject(err.message);
            } else {
                resolve(temp);
            }
        });
    });
}


module.exports = {
    getAmbientTemp
};