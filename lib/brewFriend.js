const https = require('https');
const _ = require('lodash');
const config = require('../config/config.json');
const log4js = require('log4js').configure('./config/logger.json');
const logger = log4js.getLogger('brewFriend');
const sensor = require('./sensor.js');
const schedule = require('node-schedule');

let apiKey;

let getAPIOptions = () => {
    return new Promise((resolve) => {
        resolve({
            hostname: config.brewFriend.host,
            headers: {
                [config.brewFriend.header]: apiKey
            }
        });
    });
};

let getStreamOptions = () => {
    return new Promise((resolve) => {
        resolve({
            hostname: config.brewFriend.stream,
            path: `${config.brewFriend.path.stream}/`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [config.brewFriend.header]: apiKey
            }
        });
    });
};

function setFermentationMonitor(request) {
    return new Promise((resolve, reject) => {
        if(request.params.brewSessionId) {
            logger.info(`Starting brew session for ${request.params.brewSessionId}`);
            let j = schedule.scheduleJob('*/16 * * * *', () => {
                logger.info(`Getting sensor temperature data`);
                sensor.getAmbientTemp().then((temp) => {
                    logger.info(`Current temp is ${temp} at ${Date.now()}`);
                    let postBody = {
                        "name": "Raspi Brew Monitor",
                        "temp": temp,
                        "temp_unit": "C"
                    };
                    getStreamOptions().then((options) => {
                        options.body = JSON.stringify(postBody);
                        options.agent = new https.Agent(options);
                        logger.info(JSON.stringify(options));
                        const req = https.request(options, (res) => {
                            let data = '';
                            res.on('data', (body) => {
                                data += body;
                            });
                            res.on('end', () => {
                                if (res.statusCode === 200) {
                                    logger.info(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                                    try {
                                        data = JSON.parse(data);
                                        logger.info(`Received response woth data=${data}`);
                                    } catch (err) {
                                        // errorHandler handles error logging
                                        logger.error(`Unable to parse response from ${options.path}, err=${err.message}`);
                                    }
                                } else {
                                    // errorHandler handles error logging
                                    logger.error(`Failed to POST data to ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                                }
                            });
                        });
                        req.on('error', (err) => {
                            // errorHandler handles error logging
                            logger.error(`Failed to get data from ${options.path}, err=${err.message}`);
                        });
                        req.end();
                    });
                    logger.info('Scheduled job ran');
                }, (err) => {
                    logger.error(`Unable to get fermentor temp, err=${err}`);
                });
            });
            resolve();
        } else {
            reject({ errorCode: 504, errorStatus: 'Problem occurred starting new fermentation session.' });
        }
    });
}

function getBrewSessions() {
    return new Promise((resolve, reject) => {
        if(!_.isEmpty(apiKey)) {
            getAPIOptions().then((options) => {
                options.path = `${config.brewFriend.version}${config.brewFriend.path.brewSessions}`;
                options.agent = new https.Agent(options);
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (body) => {
                        data += body;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            logger.info(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                            try {
                                data = JSON.parse(data);
                                let availableSession = [];
                                _.forEach(data.brewsessions, (session) => {
                                    let newSession = {
                                        id: `http://localhost:3000/fermentation/${session.id}`,
                                        name: session.recipe_title
                                    }
                                    availableSession.push(newSession);
                                });
                                resolve(availableSession);
                            } catch (err) {
                                // errorHandler handles error logging
                                logger.error(`Unable to parse response from ${options.path}, err=${err.message}`);
                                reject();
                            }
                        } else {
                            // errorHandler handles error logging
                            logger.error(`Failed to get data from ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                            reject(res);
                        }
                    });
                });
                req.on('error', (err) => {
                    // errorHandler handles error logging
                    logger.error(`Failed to get data from ${options.path}, err=${err.message}`);
                    reject(err);
                });
                req.end();
            }, (err) => {
                reject(err);
            });
        } else {
            reject({ errorCode: 504, errorStatus: 'Missing API key for brew friends.' });
        }
    });
}

function setAPIKey(request) {
    return new Promise((resolve, reject) => {
        logger.info(JSON.stringify(request.params));
        if(request.params.brewFriendKey) {
            apiKey = request.params.brewFriendKey;
            resolve();
        } else {
            reject({ errorCode: 504, errorStatus: 'Problem occurred settings API Key.' });
        }
    });
}

module.exports = {
    getBrewSessions,
    setAPIKey,
    setFermentationMonitor
};