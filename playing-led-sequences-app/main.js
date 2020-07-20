/*
 * Copyright (c) 2019  Moddable Tech, Inc.
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

import Digital from "builtin/digital";
import  {SequenceLED, IdleLED} from "led";

class ButtonMonitor extends Digital {
	constructor(dictionary){
		super({ pin: 0, 
			mode: Digital.InputPullUp, 
			edge: Digital.Rising | Digital.Falling,

		onReadable(){
			let state = this.read();
			this.led2.monitorButton(state);
		}
		});
	this.led2 = dictionary.led2;
	}
}

const led16 = new IdleLED();
const led2 = new SequenceLED(led16);

const button = new ButtonMonitor({led2});
