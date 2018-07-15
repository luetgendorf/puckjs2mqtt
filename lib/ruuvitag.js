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

var Parser = require('binary-parser').Parser;

RuuviV5 = new Parser()
  .endianess("big")
  .int16("temperature")
  .int16("humidity")
  .uint16("pressure")
  .int16("ax")
  .int16("ay")
  .int16("az")
  .bit11("voltage")
  .bit5("txpower")
  .uint8("movecount")
  .uint16("seq");

RuuviData = new Parser()
  .endianess("big")
  .uint8("version")
  .choice({
    tag: "version",
    choices: {
      5: RuuviV5,
    },
    defaultChoice: new Parser(),
  });

exports.processRuuvi = function(data) {
  result = RuuviData.parse(data);
  console.log(JSON.stringify(result));
}

