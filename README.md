# TinLion Brewing Monitor

TinLion Brew Monitor

## Usage

Application designed to monitor fermentation progress using iSpindel, ecobee3, and DS18B20 sensor interfacing with a Raspberry Pi Zero W. The Pi 
will interface with the Brewers Friend API. The application will be controlled through a web interface built on React.

### Running the application

From the application directory

```node ./lib/main.js```

Using npm scripts

```npm run start```

### Resources
* [ds18b20-raspi](https://www.npmjs.com/package/ds18b20-raspi)