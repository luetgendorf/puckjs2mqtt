/*
 * This file is part of EspruinoHub, a Bluetooth-MQTT bridge for
 * Puck.js/Espruino JavaScript Microcontrollers
 *
 * Copyright (C) 2016 Gordon Williams <gw@pur3.co.uk>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * ----------------------------------------------------------------------------
 *  Converts BLE advertising packets to MQTT
 * ----------------------------------------------------------------------------
 */

var debug = require('debug')('puckjs')
var noble = require('noble');
var Parser = require('binary-parser').Parser;
var mqtt = require('./mqttclient');
var config = require('./config');
var attributes = require('./attributes');
var puckjs = require('./puckjs');

// List of BLE devices that are currently in range
var inRange = {};
var packetsReceived = 0;
var lastPacketsReceived = 0;
var scanStartTime = Date.now();
var isScanning = false;

function log(x) {
  console.log("<Discover> "+x);
}

const ha_config = [
  {
    type: 'sensor',
    object_id: 'temperature',
    discovery_payload: {
      unit_of_measurement: '°C',
      icon: 'mdi:temperature-celsius',
      device_class: 'temperature',
      value_template: '{{ value_json.temperature }}',
      json_attributes: ['voltage'],
    },
  },
]


// ----------------------------------------------------------------------
function onStateChange(state) {
  if (state!="poweredOn") return;
  // delay startup to allow Bleno to set discovery up
  setTimeout(function() {
    log("Starting scan...");
    noble.startScanning([], true);
  }, 1000);
};

// ----------------------------------------------------------------------
function onDiscovery(peripheral) {
  var addr = peripheral.address;
  var id = addr;
  if (id in config.known_devices) {
    id = config.known_devices[id];
  } else {
    if (config.only_known_devices)
      return;
  }
  packetsReceived++;

  if (peripheral.advertisement.manufacturerData) {
    // TODO skip the toString
    var manu = peripheral.advertisement.manufacturerData.slice(0, 2).toString('hex');
    if (manu === "9005") {
      sensorData = puckjs.ParsePuckjs(peripheral.advertisement.manufacturerData.slice(2));
      var name = peripheral.advertisement.localName // ? peripheral.advertisement.localName : id;
      debug('Found %o with address', name, addr);
      if (sensorData && name) {
        name = name.replace(/:/g, '').replace(/-/g, '_');
        debug('Found sensorData %o of %o', sensorData, name);
        var entered = !inRange[addr];
        if (entered) {
          inRange[addr] = {
            id : id,
            address : addr,
            peripheral: peripheral,
            name : "?",
            data : {}
          };
          // HA discovery
          ha_config.forEach((cfg) => {
            const id = addr.replace(/:/g, '');
            const topic = `${cfg.type}/${id}/${cfg.object_id}/config`;
            const payload = cfg.discovery_payload;
            payload.state_topic = `${config.base_topic}/${name}`;
            payload.availability_topic = `${config.base_topic}/bridge/state`;
            payload.name = `${name}_${cfg.object_id}`;
            if (name === addr) {
              payload.unique_id = `${id}_${cfg.object_id}_${config.base_topic}`;
            }
            mqtt.send("homeassistant/" + topic, JSON.stringify(payload), { retain: true }, null);
          });
        }

        inRange[addr].lastSeen = Date.now();
        inRange[addr].rssi = peripheral.rssi;
        inRange[addr].name = name;

        sensorData.rssi = peripheral.rssi;
        sensorData.name = name;
        mqtt.send(`${config.base_topic}/${name}`, JSON.stringify(sensorData));
      }
    }
  }
}


/** If a BLE device hasn't polled in for 60 seconds, emit a presence event */
function checkForPresence() {
  var timeout = Date.now() - 60*1000; // 60 seconds

  if (!isScanning || scanStartTime>timeout)
    return; // don't check, as we're not scanning/haven't had time

  Object.keys(inRange).forEach(function(addr) {
    if (inRange[addr].lastSeen < timeout) {
      // TODO: publish clear message
      mqtt.send("/ble/presence/"+inRange[addr].id, "0");
      delete inRange[addr];
    }
  });
}

function checkIfBroken() {
  if (isScanning) {
    // If no packets for 10 seconds, restart
    if (packetsReceived==0 && lastPacketsReceived==0) {
      log("BLE broken? No advertising packets in "+ config.ble_timeout +" seconds - restarting!");
      process.exit(1);
   } 
  } else {
    packetsReceived = 1; // don't restart as we were supposed to not be advertising
  } 
  lastPacketsReceived = packetsReceived;
  packetsReceived = 0;
}

exports.init = function() {
  noble.on('stateChange',  onStateChange);
  noble.on('discover', onDiscovery);
  noble.on('scanStart', function() {  
    isScanning=true; 
    scanStartTime = Date.now();
    log("Scanning started."); 
  });
  noble.on('scanStop', function() { isScanning=false; log("Scanning stopped.");});
  setInterval(checkForPresence, 1000);
  if (config.ble_timeout>0)
    setInterval(checkIfBroken, config.ble_timeout * 1000);
};

exports.inRange = inRange;

exports.restartScan = function() {
  if (!isScanning) {
    noble.startScanning([], true);
  }
}

exports.stopScan = function() {  
  if (isScanning) {
    noble.stopScanning();
  }
}
