/*
 * This file is part of EspruinoHub, a Bluetooth-MQTT bridge for
 * Puck.js/Espruino JavaScript Microcontrollers
 *
 * Copyright (C) 2016 Gordon Williams <gw@pur3.co.uk>
 * Copyright (C) 2018 Petru Paler <petru@paler.net>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * ----------------------------------------------------------------------------
 *  Parses Ruuvitag sensor data
 * ----------------------------------------------------------------------------
 */

var Parser = require('binary-parser').Parser;
var debug = require('debug')('puckjs')

// PuckjsV2 = new Parser()
//   .endianess("big")
//   .int16("temperature", {
//     formatter: v => v * 0.005
//   })
//   .uint16("humidity", {
//     formatter: v => {
//       v *= 0.0025;
//       return Math.min(v, 100);
//     }
//   })
//   .uint16("pressure", {
//     formatter: v => (v + 50000) / 100
//   })
//   .int16("ax")
//   .int16("ay")
//   .int16("az")
//   .bit11("voltage")
//   .bit5("txpower", {
//     formatter: v => v * 2 - 40
//   })
//   .uint8("movecount")
//   .uint16("seq")
//   .array("mac", {
//     type: "uint8",
//     length: 6,
//     formatter: v => v.map(e => e.toString(16)).join(":")
//   });
PuckjsV1 = new Parser()
  .endianess("big")
  .uint8("clickcount")
;

PuckjsV2 = new Parser()
  .endianess("big")
  .uint8("active_periferals")
  .uint8("battery_level", {
    formatter: v => (v / 0xff ) + 2
  })
  .uint8("temperature", {
    formatter: v => (v * 0.5 ) + -40
  })
  .uint8("light_level", {
    formatter: v => v / 0xff
  })
  .uint8("cap_sense", {
    formatter: v => v / 0xff * 262144
  })
  .array("magnetometer", {
    type: "uint8",
    length: 6
  })
;

PuckjsData = new Parser()
  .endianess("big")
  .uint8("version")
  .choice({
    tag: "version",
    choices: {
      1: PuckjsV1,
      2: PuckjsV2
    },
    defaultChoice: new Parser(),
  });

exports.ParsePuckjs = function(data) {
  result = PuckjsData.parse(data);

  if ("version" in result && result.version > 1) {
    delete result.version;

//    result.acceleration = Math.sqrt(result.ax ** 2 + result.ay ** 2 + result.az ** 2);
//    delete result.ax;
//    delete result.ay;
//    delete result.az;

    // for some reason this doesn't work as a Parser formatter
//    result.voltage += 1600;
//    result.voltage /= 1000;

    // keep at most 2 decimals
//    result.temperature = Math.round(result.temperature * 10) / 10;
//    result.humidity = Math.round(result.humidity * 10) / 10;

    return result;
  }
}

