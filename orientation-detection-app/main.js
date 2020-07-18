/*
 * Copyright (c) 2016-2020 Moddable Tech, Inc.
 *
 *   This file is part of the Moddable SDK.
 * 
 *   This work is licensed under the
 *       Creative Commons Attribution 4.0 International License.
 *   To view a copy of this license, visit
 *       <http://creativecommons.org/licenses/by/4.0>.
 *   or send a letter to Creative Commons, PO Box 1866,
 *   Mountain View, CA 94042, USA.
 *
 */
import config from "mc/config";
import {Request} from "http";
import LSM9DS1 from "lsm9ds1";

// const POSITIONS = ['RIGHT SIDE', 'LEFT SIDE', 'ON BACK', 'ON FACE', 'UPSIDE DOWN', 'RIGHT SIDE UP'];
const POSITIONS = ['chevron-circle-right', 'chevron-circle-left', 'square-o', 'square', 'chevron-circle-down', 'chevron-circle-up'];
const ORIENTATION_THRESHOLD = 0.8
const FILTERING_THRESHOLD = 1.2

function setWidth(number, width){
	let string = number.toFixed(width);
	if (number >= 0) string = " " + string;
	return string;
}

function streamData(data) {
	let request = new Request({ 
		host: "io.adafruit.com",
		path: `/api/v2/${config.username}/feeds/${config.feedKey}/data`,
		method: "POST",
		headers: [ "X-AIO-Key", config.AIOKey, "Content-Type", "application/json" ],
		body: JSON.stringify({ value: data }),
		response: String,
		// Socket: SecureSocket,
		// port: 443,
		// secure: {protocolVersion: 0x302}
	});
	request.callback = function(message, value, etc) {
		if ((message == 2) && (value == "status")) {
			if (etc == "200 OK") {
				trace(`Sent data "${data}"\n`);
			} else {
				trace(`Error sending data "${data}". Error code: ${etc}\n`);
			}
		}
	}
}

function getOrientation(sample){
	var orientation;
	let ax = Math.abs(sample.x);
	let ay = Math.abs(sample.y);
	let az = Math.abs(sample.z);

	let sumxyz = Math.abs(sample.x + sample.y + sample.z);
	if (sumxyz < FILTERING_THRESHOLD){
		if (sample.x * sample.y > 0 && sample.x >= ORIENTATION_THRESHOLD) {
			// trace("right side up\n");
			orientation = POSITIONS[5];
		}
		else if (sample.x * sample.y < 0 && sample.x <= -ORIENTATION_THRESHOLD ) {
			// trace("up side down\n");
			orientation = POSITIONS[4];
		}
		else if (sample.x * sample.y < 0 && sample.y >= ORIENTATION_THRESHOLD ) {
			// trace("right\n");
			orientation = POSITIONS[0];
		}
		else if (sample.x * sample.y > 0 && sample.y <= -ORIENTATION_THRESHOLD ) {
			// trace("left\n");
			orientation = POSITIONS[1];
		}
		else if (sample.x * sample.y < 0 && az >= 1.8 ) {
			// trace("face down\n");
			orientation = POSITIONS[2];
		}
		else if (ax + ay + az <= 0.2 ) {
			// trace("face up\n");
			orientation = POSITIONS[3];
		}
		return orientation;
	}
}

let sensor = new LSM9DS1({ operation: "accelerometer", sda: 4, scl: 5});
let prevFace; 
const interval = 10;

System.setInterval(() => {
	let sample = sensor.sample();
	let face = getOrientation(sample);

	if (face !== undefined && face !== prevFace){
		trace(`current face: ${face}\n`);
		prevFace = face;
		streamData(face);
	}

}, interval);
