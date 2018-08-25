ruuvi2mqtt
===========

A [RuuviTag](https://ruuvi.com/) -> MQTT bridge supporting [Home Assistant MQTT discovery](https://www.home-assistant.io/docs/mqtt/discovery/).

Based on the excellent [EspruinoHub](https://github.com/espruino/EspruinoHub) and very much a work in progress.

Setting up
----------

Ideally use a Raspberry Pi 3 or Zero W, as these have Bluetooth LE on them already. However the BLE USB dongles [mentioned in the Puck.js Quick Start guide](http://www.espruino.com/Puck.js+Quick+Start#requirements) should work.

### Get Raspbian running on your Raspberry Pi

* Download Raspbian Lite from https://www.raspberrypi.org/downloads/raspbian/
* Copy it to an SD card with `sudo dd if=2017-11-29-raspbian-stretch-lite.img of=/dev/sdc status=progress bs=1M` on Linux (or see the instructions on the Raspbian download page above for your platform)
* Unplug and re-plug the SD card and add a file called `ssh` to the `boot` drive - this will enable SSH access to the Pi
* If you're using WiFi rather than Ethernet, see [this post on setting up WiFi via the SD card](https://raspberrypi.stackexchange.com/questions/10251/prepare-sd-card-for-wifi-on-headless-pi)
* Now put the SD card in the Pi, apply power, and wait a minute
* `ssh pi@raspberrypi.local` (or use PuTTY on Windows) and use the password `raspberry`
* Run `sudo raspi-config` and set the Pi up as you want (eg. hostname, password)

### Installation

```
# Install Node, Bluetooth, etc
sudo apt-get update
sudo apt-get install git-core nodejs nodejs-legacy npm build-essential mosquitto mosquitto-clients bluetooth bluez libbluetooth-dev libudev-dev
# Now get ruuvi2mqtt
git clone https://github.com/ppetru/ruuvi2mqtt
# Install ruuvi2mqtt's required Node libraries
cd ruuvi2mqtt
npm install
# Optional - enable gathering of historical data by creating a 'log' directory
mkdir log
# Give Node.js access to Bluetooth
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

You can now type `./start.sh` to run ruuvi2mqtt, but it's worth checking out the `Auto Start` section to see how to get it to run at boot.

### Auto Start

There are a 2 main ways to run ruuvi2mqtt on the Raspberry Pi.

#### Headless Startup

This is the normal way of running services - to configure them as a system start-up job using `systemd`:**

```
    sudo cp systemd-ruuvi2mqtt.service /etc/systemd/system/ruuvi2mqtt.service
```

and edit it as necessary to match your installation directory and user configuration.  Then, to start it for testing:

```
    sudo systemctl start ruuvi2mqtt.service && sudo journalctl -f -u ruuvi2mqtt
```

If it works, Ctrl-C to break out and enable it to start on login:

```
    sudo systemctl enable ruuvi2mqtt.service
```


#### Console Startup

If you have a video output on your Pi then you can run ruuvi2mqtt at boot - on the main display - so that you can see what it's reporting.

* Edit `.bashrc` and add the following right at the bottom:

```
if [ $(tty) == /dev/tty1 ]; then
  while true; do
    ruuvi2mqtt/start.sh
    sleep 1s
  done
fi
```

* Now run `sudo raspi-config`, choose `Boot Options`, `Desktop / CLI`, and `Console Autologin`

* Next time you reboot, the console will automatically run `ruuvi2mqtt`

Usage
-----

TBD

