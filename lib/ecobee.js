const https = require('https');
const _ = require('lodash');
const config = require('../config/config.json');
const fs = require('fs');
let tokenExpiry, access_token, refreshToken, code;
let { apiKey } = config;
fs.readFile('/home/kdancy/IdeaProjects/repo/brew-monitor/config/access_token', (err, data) => {
    if(err) {
        throw err;
    }
    refreshToken = data;
    tokenExpiry = Date.now();
});

let getAuthOptions = () => {
    return new Promise((resolve) => {
        resolve({
            hostname: config.ecobee.host,
            path: `${config.ecobee.path.auth}?response_type=ecobeePin&client_id=${apiKey}&scope=smartWrite`,
            method: 'GET'
        });
    });
};

let getTokenOptions = () => {
    return new Promise((resolve) => {
        resolve({
            hostname: config.ecobee.host,
            path: `${config.ecobee.path.token}?grant_type=ecobeePin&code=${code}&client_id=${apiKey}`,
            method: 'POST'
        });
    });
};

let getRefreshTokenOptions = () => {
    return new Promise((resolve) => {
        resolve({
            hostname: config.ecobee.host,
            path: `${config.ecobee.path.token}?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${apiKey}`,
            method: 'POST'
        });
    });
};

let getDataReqOptions = () => {
    return new Promise((resolve, reject) => {
        if(tokenExpiry < Date.now()) {
            refreshCurrentToken().then((res) => {
                resolve({
                    hostname: config.ecobee.host,
                    path: `/1/thermostat?format=json&body={"selection":{"selectionType":"registered","includeSensors":true}}`,
                    method: 'GET',
                    headers: {
                        'Content-Type': "text/json",
                        'Authorization': `Bearer ${access_token}`
                    }
                });
            }, (err) => {
                reject(err);
            });
        } else {
            resolve({
                hostname: config.ecobee.host,
                path: `/1/thermostat?format=json&body={"selection":{"selectionType":"registered","includeSensors":true}}`,
                method: 'GET',
                headers: {
                    'Content-Type': "text/json",
                    'Authorization': `Bearer ${access_token}`
                }
            });
        }
    });
};

function getEcobeePin(){
    return new Promise((resolve, reject) => {
        getAuthOptions().then((options) => {
            options.agent = new https.Agent(options);
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (body) => {
                    data += body;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                        try {
                            resolve(JSON.parse(data));
                        } catch (err) {
                            // errorHandler handles error logging
                            console.log(`Unable to parse response from ${options.path}, err=${err.message}`)
                            reject(err);
                        }
                    } else {
                        // errorHandler handles error logging
                        console.log(`Failed to get data from ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                        reject({ errorCode: 504, errorStatus: 'Problem occurred requesting pin from ecobee api.' });
                    }
                });
            });
            req.on('error', (err) => {
                // errorHandler handles error logging
                console.log(`Failed to get data from ${options.path}, err=${err.message}`);
                reject(err);
            });
            req.end();
        });
    });
}

function getAccessRefreshToken(){
    return new Promise((resolve, reject) => {
        if(!_.isEmpty(code)) {
            getTokenOptions().then((options) => {
                options.agent = new https.Agent(options);
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (body) => {
                        data += body;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            console.log(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                            try {
                                resolve(JSON.parse(data));
                            } catch (err) {
                                // errorHandler handles error logging
                                console.log(`Unable to parse response from ${options.path}, err=${err.message}`)
                                reject(err);
                            }
                        } else {
                            // errorHandler handles error logging
                            console.log(`Failed to get data from ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                            reject(JSON.parse(data));
                        }
                    });
                });
                req.on('error', (err) => {
                    // errorHandler handles error logging
                    console.log(`Failed to get data from ${options.path}, err=${err.message}`);
                    reject(err);
                });
                req.end();
            });
        } else {
            reject({ errorCode: 500 ,errorStatus: 'Ecobee pin required to get access tokens.' })
        }
    });
}

function getRefreshToken(){
    return new Promise((resolve, reject) => {
        getRefreshTokenOptions().then((options) => {
            options.agent = new https.Agent(options);
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (body) => {
                    data += body;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                        try {
                            resolve(JSON.parse(data));
                        } catch (err) {
                            // errorHandler handles error logging
                            console.log(`Unable to parse response from ${options.path}, err=${err.message}`)
                            reject(err);
                        }
                    } else {
                        // errorHandler handles error logging
                        console.log(`Failed to get data from ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                        reject(JSON.parse(data));
                    }
                });
            });
            req.on('error', (err) => {
                // errorHandler handles error logging
                console.log(`Failed to get data from ${options.path}, err=${err.message}`);
                reject();
            });
            req.end();
        });
    });
}

function getThermostatData(){
    return new Promise((resolve, reject) => {
        getDataReqOptions().then((options) => {
            options.agent = new https.Agent(options);
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (body) => {
                    data += body;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log(`Successfuly retrieved all data, statusCode=${res.statusCode}`);
                        try {
                            resolve(JSON.parse(data));
                        } catch (err) {
                            // errorHandler handles error logging
                            console.log(`Unable to parse response from ${options.path}, err=${err.message}`);
                            reject();
                        }
                    } else {
                        // errorHandler handles error logging
                        console.log(`Failed to get data from ${options.path}, message=${res.message || res.statusMessage}, statusCode=${res.statusCode}`);
                        reject(res);
                    }
                });
            });
            req.on('error', (err) => {
                // errorHandler handles error logging
                console.log(`Failed to get data from ${options.path}, err=${err.message}`);
                reject(err);
            });
            req.end();
        }, (err) => {
            reject(err);
        });
    });
}

function ecobeePin() {
    return new Promise((resolve, reject) => {
        getEcobeePin().then((res) => {
            console.log(res);
            code = res.code;
            resolve(res);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    })

}

function accessRefeshToken() {
    return new Promise((resolve, reject) => {
        getAccessRefreshToken().then((res) => {
            console.log(res);
            access_token = res.access_token;
            fs.writeFile('/home/kdancy/IdeaProjects/repo/brew-monitor/config/access_token', access_token);
            refreshToken = res.refresh_token;
            tokenExpiry = Date.now() + (res.expires_in * 1000);
            resolve(res);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    });
}


function refreshCurrentToken() {
    return new Promise((resolve, reject) => {
        getRefreshToken().then((res) => {
            access_token = res.access_token;
            fs.writeFile('/home/kdancy/IdeaProjects/repo/brew-monitor/config/access_token', access_token);
            console.log(res);
            resolve(res);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    });
}

function thermostatData() {
    return new Promise((resolve, reject) => {
        getThermostatData().then((res) => {
            resolve(res);
        }, (err) => {
            console.log(err);
            reject(err);
        });
    });

}

module.exports = {
    thermostatData,
    refreshCurrentToken,
    accessRefeshToken,
    ecobeePin
};

