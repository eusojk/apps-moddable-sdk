/*
 * Copyright (c) 2018-2020  Moddable Tech, Inc.
 *
 *   This file is part of the Moddable SDK Runtime.
 * 
 *   The Moddable SDK Runtime is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 * 
 *   The Moddable SDK Runtime is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 * 
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with the Moddable SDK Runtime.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
/*
	LSM9DS1 IMU.
	Currently configured only for polling — no interrupts.
		https://www.sparkfun.com/products/13284
    Datasheet: https://cdn.sparkfun.com/assets/learn_tutorials/3/7/3/LSM9DS1_Datasheet.pdf
*/

import SMBus from "smbus";

const Register = Object.freeze({
	//AccelerometerGyro
	WHO_AM_I:			0x0F,
	CTRL_REG1_G:	0x10,
	CTRL_REG2_G:	0x11,
	CTRL_REG3_G:	0x12,
	ORIENT_CFG_G:	0x13,
	OUT_TEMP_L:		0x15,
	OUT_TEMP_H:		0x16,
	STATUS_REG:		0x17,
	OUT_X_L_G:		0x18,
	OUT_X_H_G:		0x19,
	OUT_Y_L_G:		0x1A,
	OUT_Y_H_G:		0x1B,
	OUT_Z_L_G:		0x1C,
	OUT_Z_H_G:		0x1D,
	CTRL_REG4:		0x1E,
	CTRL_REG5_XL:	0x1F,
	CTRL_REG6_XL: 0x20,
	CTRL_REG7_XL:	0x21,
	CTRL_REG8:		0x22,
	CTRL_REG9:		0x23,
	CTRL_REG10:		0x24,
	OUT_X_XL:			0x28,
	OUT_Y_XL:			0x2A,
	OUT_Z_XL:			0x2C,
	
	//Magnetometer
	OFFSET_X_REG_L_M:		0x05,
	OFFSET_X_REG_H_M:		0x06,
	OFFSET_Y_REG_L_M:		0x07,
	OFFSET_Y_REG_H_M:		0x08,
	OFFSET_Z_REG_L_M:		0x09,
	OFFSET_Z_REG_H_M:		0x0A,
	WHO_AM_I_M:					0x0F,
	CTRL_REG1_M:				0x20,
	CTRL_REG2_M:				0x21,
	CTRL_REG3_M:				0x22,
	CTRL_REG4_M:				0x23,
	CTRL_REG5_M:				0x24,
	STATUS_REG_M:				0x27,
	OUT_X_L_M:					0x28,
	OUT_X_H_M:					0x29,
	OUT_Y_L_M:					0x2A,
	OUT_Y_H_M:					0x2B,
	OUT_Z_L_M:					0x2C,
	OUT_Z_H_M:					0x2D,
	INT_CFG_M:					0x30,
	INT_SRC_M:					0x31,
	INT_THS_L:					0x32,
	INT_THS_H:					0x33
});


const CTRL_REG1_G = Object.freeze({
	ODR_POWER_DOWN:		0b00000000,
	ODR_14_9:					0b00100000,
	ODR_59_5:					0b01000000,
	ODR_119:					0b01100000,
	ODR_238:					0b10000000,
	ODR_476:					0b10100000,
	ODR_952:					0b11000000,
	FS_245DPS:				0b00000000,
	FS_500DPS:				0b00001000,
	FS_2000DPS:				0b00011000,
	BW_00:						0b00000000,
	BW_01:						0b00000001,
	BW_10:						0b00000010,
	BW_11:						0b00000011
});

const CTRL_REG2_G = Object.freeze({
	OUT_SEL_00:				0b00000000,
	OUT_SEL_01:				0b00000001,
	OUT_SEL_10:				0b00000010,
	OUT_SEL_11:				0b00000011,
});

const CTRL_REG3_G = Object.freeze({
	LP_mode:					0b10000000,
	HP_EN:						0b01000000,
	HPCF_0000:				0b00000000, 
	HPCF_0001:				0b00000001,
	HPCF_0010:				0b00000010,
	HPCF_0011:				0b00000011,
	HPCF_0100:				0b00000100,
	HPCF_0101:				0b00000101,
	HPCF_0110:				0b00000110,
	HPCF_0111:				0b00000111,
	HPCF_1000:				0b00001000,
	HPCF_1001:				0b00001001,
});

const ORIENT_CFG_G = Object.freeze({
	SignX_G:					0b00100000,
	SignY_G:					0b00010000,
	SignZ_G:					0b00001000,
});

const CTRL_REG4 = Object.freeze({
	Zen_G:						0b00100000,
	Yen_G:						0b00010000,
	Xen_G:						0b00001000,
	LIR_XL1:					0b00000010,
	FOURD_XL1:				0b00000001
});

const CTRL_REG5_XL = Object.freeze({
	DEC_NO_DECIMATION:	0b00000000,
	DEC_TWO_SAMPLES:		0b01000000,
	DEC_FOUR_SAMPLES:		0b10000000,
	DEC_EIGHT_SAMPLES:	0b11000000,
	Zen_XL:							0b00100000,
	Yen_XL:							0b00010000,
	Xen_XL:							0b00001000
});

const CTRL_REG6_XL = Object.freeze({
	ODR_POWER_DOWN:			0b00000000,
	ODR_10:							0b00100000,
	ODR_50:							0b01000000,
	ODR_119:						0b01100000,
	ODR_238:						0b10000000,
	ODR_476:						0b10100000,
	ODR_952:						0b11000000,
	FS_2G:							0b00000000,
	FS_16G:							0b00001000,
	FS_4G:							0b00010000,
	FS_8G:							0b00011000,
	BW_SCAL_ODR:				0b00000100,
	BW_408:							0b00000000,
	BW_211:							0b00000001,
	BW_105:							0b00000010,
	BW_50:							0b00000011
});

const CTRL_REG7_XL = Object.freeze({
	HR:									0b10000000,
	DCF_50:							0b00000000,
	DCF_100:						0b00100000,
	DCF_9:							0b01000000,
	DCF_400:						0b01100000,
	FDS:								0b00000100,
	HPIS1:							0b00000001
});

const CTRL_REG8 = Object.freeze({
	BOOT:								0b10000000,
	BDU:								0b01000000,
	H_LACTIVE:					0b00100000,
	PP_OD:							0b00010000,
	SIM:								0b00001000,
	IF_ADD_INC:					0b00000100,
	BLE_BIG_ENDIAN:			0b00000010,
	BLE_LITTLE_ENDIAN:	0b00000000,
	SW_RESET:						0b00000001
});

const CTRL_REG9 = Object.freeze({
	SLEEP_G:						0b01000000,
	FIFO_TEMP_EN:				0b00010000,
	DRDY_mask_bit:			0b00001000,
	I2C_DISABLE:				0b00000100,
	FIFO_EN:						0b00000010,
	STOP_ON_FTH:				0b00000001
});

const CTRL_REG10 = Object.freeze({
	ST_G:					0b00000100,
	ST_XL:				0b00000001
});

const StatusReg = Object.freeze({
	IG_XL:				0b01000000,
	IG_G:					0b00100000,
	INACT:				0b00010000,
	BOOT_STATUS:	0b00001000,
	TDA:					0b00000100,
	GDA:					0b00000010,
	XLDA:					0b00000001
});

const GRES_VALUES = Object.freeze({ //Per Datasheet Table 3, G_So
	FS_245DPS: 0.00875,
	FS_500DPS: 0.0175,
	FS_2000DPS: 0.07
});

const XLRES_VALUES = Object.freeze({ //Per Datasheet Table 3, LA_So
	FS_2G: 0.000061,
	FS_4G: 0.000122,
	FS_8G: 0.000244,
	FS_16G: 0.000732
});

const CTRL_REG1_M = Object.freeze({
	TEMP_COMP:		0b10000000,
	OM_LOWPOWER:	0b00000000,
	OM_MEDIUM:		0b00100000,
	OM_HIGH:			0b01000000,
	OM_ULTRA:			0b01100000,
	DO_0_625:			0b00000000,
	DO_1_25:			0b00000100,
	DO_2_5:				0b00001000,
	DO_5:					0b00011000,
	DO_10:				0b00010000,
	DO_20:				0b00010100,
	DO_40:				0b00011000,
	DO_80:				0b00011100,
	FAST_ODR:			0b00000010,
	ST:						0b00000001
});

const CTRL_REG2_M = Object.freeze({
	FS_4GAUSS:		0b00000000,
	FS_8GAUSS:		0b00100000,
	FS_12GAUSS:		0b01000000,
	FS_16GAUSS:		0b01100000,
	REBOOT:				0b00001000,
	SOFT_RST:			0b00000100
});

const CTRL_REG3_M = Object.freeze({
	I2C_DISABLE:		0b10000000,
	LP:							0b00100000,
	SIM:						0b00000100,
	MD_CONTINUOUS:	0b00000000,
	MD_SINGLE:			0b00000001,
	MD_POWER_DOWN1:	0b00000010,
	MD_POWER_DOWN2:	0b00000011
});

const CTRL_REG4_M = Object.freeze({
	OM_LOWPOWER:				0b00000000,
	OM_MEDIUM:					0b00000100,
	OM_HIGH:						0b00001000,
	OM_ULTRA:						0b00001100,
	BLE_LITTLE_ENDIAN:	0b00000000,
	BLE_BIG_ENDIAN:			0b00000010
});

const CTRL_REG5_M = Object.freeze({
	FAST_READ:	0b10000000,
	BDU:				0b01000000
});

const Control_Register_Values = Object.freeze({
	CTRL_REG1_G,
	CTRL_REG2_G,
	CTRL_REG3_G,
	CTRL_REG4,
	CTRL_REG5_XL,
	CTRL_REG6_XL,
	CTRL_REG7_XL,
	CTRL_REG8,
	CTRL_REG9,
	CTRL_REG10,
	CTRL_REG1_M,
	CTRL_REG2_M,
	CTRL_REG3_M,
	CTRL_REG4_M,
	CTRL_REG5_M
});

const MRES_VALUES = Object.freeze({ //Per Datasheet Table 3, M_GN
	FS_4GAUSS:	0.00014,
	FS_8GAUSS:	0.00029,
	FS_12GAUSS:	0.00043,
	FS_16GAUSS:	0.00058
});

class AccelerometerGyro extends SMBus {
	constructor(dictionary){
		super({ ...dictionary, address: 0x6B, hz: 600000 });
		this.readingsBuffer = new ArrayBuffer(6);
		this.view = new DataView(this.readingsBuffer);
    
		this.settings = {
			ODR_G: CTRL_REG1_G.ODR_952, FS_G: CTRL_REG1_G.FS_245DPS, BW_G: CTRL_REG1_G.BW_00,															//Control Register 1 (Gyro)
			OUT_SEL: CTRL_REG2_G.OUT_SEL_00,																											//Control Register 2 (Gyro)
			LP_mode: false, HP_EN: false, HPCF_G: CTRL_REG3_G.HPCF_0000,																				//Control Register 3 (Gyro)
			SignX_G: false, SignY_G: false, SignZ_G: false, Orient: 0,																					//Orientation Configuration Register (Gyro)
			Zen_G: true, Yen_G: true, Xen_G: true, LIR_XL1: true, FOURD_XL1: false,																		//Control Register 4
			DEC: CTRL_REG5_XL.DEC_NO_DECIMATION, Zen_XL: true, Yen_XL: true, Xen_XL: true,																//Control Register 5 (Accelerometer)
			ODR_XL: CTRL_REG6_XL.ODR_952, FS_XL: CTRL_REG6_XL.FS_2G, BW_SCAL_ODR: false, BW_XL: CTRL_REG6_XL.BW_408,									//Control Register 6 (Accelerometer)
			HR: false, DCF: CTRL_REG7_XL.DCF_50, FDS: false, HPIS1: false,																				//Control Register 7 (Accelerometer)
			BOOT: false, BDU: false, H_LACTIVE: false, PP_OD: false, SIM: false, IF_ADD_INC: true, BLE: CTRL_REG8.BLE_LITTLE_ENDIAN, SW_RESET: false,	//Control Register 8
			SLEEP_G: false, FIFO_TEMP_EN: false, DRDY_mask_bit: false, I2C_DISABLE: false, FIFO_EN: false, STOP_ON_FTH: false, 							//Control Register 9
			ST_G: false, ST_XL: 0,																														//Control Register 10
			blocking: true
		}
		
		this.checkIdentification();
		this.configure({initializeAll: true});
		this.gxBias = this.gyBias = this.gzBias = 0;
		this.xlxBias = this.xlyBias = this.xlzBias = 0;
		this.calibrate();
		this.operation = "gyro";
	}
  
	checkIdentification(){
		let id = super.readByte(Register.WHO_AM_I);
		if (id != 0x68) throw("unexpected device ID for LSM9DS1 accelerometer and gyro");
	}
  
	configure(dictionary){
		if ("operation" in dictionary){
			this.operation = dictionary.operation;
			delete dictionary.operation;
		}

		if (Object.keys(dictionary).length == 0) return;
		Object.assign(this.settings, dictionary);
		let settings = this.settings;

		if (settings.I2C_DISABLE){
			settings.I2C_DISABLE = false; //Don't accidentally disable I2C when I2C is the only signal pathway we have.
			throw("Don't disable I2C on the LSM9DS1 in the I2C driver.");
		}

		let value = settings.ODR_G | settings.FS_G | settings.BW_G;
		super.writeByte(Register.CTRL_REG1_G, value);
		value = settings.OUT_SEL;
		super.writeByte(Register.CTRL_REG2_G, value);
		value = settings.HPCF_G | (settings.LP_mode ? CTRL_REG3_G.LP_mode : 0) | (settings.HP_EN ? CTRL_REG3_G.HP_EN : 0);
		super.writeByte(Register.CTRL_REG3_G, value);
		value = (settings.SignX_G ? ORIENT_CFG_G.SignX_G : 0) | (settings.SignY_G ? ORIENT_CFG_G.SignY_G : 0) | (settings.SignZ_G ? ORIENT_CFG_G.SignZ_G : 0) | settings.Orient;
		super.writeByte(Register.ORIENT_CFG_G, value);
		value = (settings.Zen_G ? CTRL_REG4.Zen_G : 0) | (settings.Yen_G ? CTRL_REG4.Yen_G : 0) | (settings.Xen_G ? CTRL_REG4.Xen_G : 0) | (settings.LIR_XL1 ? CTRL_REG4.LIR_XL1 : 0) | (settings.FOURD_XL1 ? CTRL_REG4.FOURD_XL1 : 0);
		super.writeByte(Register.CTRL_REG4, value);
		value = settings.DEC | (settings.Zen_XL ? CTRL_REG5_XL.Zen_XL : 0) | (settings.Yen_XL ? CTRL_REG5_XL.Yen_XL : 0) | (settings.Xen_XL ? CTRL_REG5_XL.Xen_XL : 0);
		super.writeByte(Register.CTRL_REG5_XL, value);
		value = settings.ODR_XL | settings.FS_XL | (settings.BW_SCAL_ODR ? CTRL_REG6_XL.BW_SCAL_ODR : 0) | settings.BW_XL;
		super.writeByte(Register.CTRL_REG6_XL, value);
		value = (settings.HR ? CTRL_REG7_XL.HR : 0) | settings.DCF | (settings.FDS ? CTRL_REG7_XL.FDS : 0) | (settings.HPIS1 ? CTRL_REG7_XL.HPIS1 : 0);
		super.writeByte(Register.CTRL_REG7_XL, value);
		value = (settings.BOOT ? CTRL_REG8.BOOT : 0) | (settings.BDU ? CTRL_REG8.BDU : 0) | (settings.H_LACTIVE ? CTRL_REG8.H_LACTIVE : 0) | 
			(settings.PP_OD ? CTRL_REG8.PP_OD : 0) | (settings.SIM ? CTRL_REG8.SIM : 0) | (settings.IF_ADD_INC ? CTRL_REG8.IF_ADD_INC : 0) | 
			(settings.SW_RESET ? CTRL_REG8.SW_RESET : 0) | settings.BLE;
		super.writeByte(Register.CTRL_REG8, value);
		value = (settings.SLEEP_G ? CTRL_REG9.SLEEP_G : 0) | (settings.FIFO_TEMP_EN ? CTRL_REG9.FIFO_TEMP_EN : 0) | (settings.DRDY_mask_bit ? CTRL_REG9.DRDY_mask_bit : 0) | 
						(settings.I2C_DISABLE ? CTRL_REG9.I2C_DISABLE : 0) | (settings.FIFO_EN ? CTRL_REG9.FIFO_EN : 0) | (settings.STOP_ON_FTH ? CTRL_REG9.STOP_ON_FTH : 0);

		super.writeByte(Register.CTRL_REG9, value);
		value = (settings.ST_G ? CTRL_REG10.ST_G : 0) | (settings.ST_XL ? CTRL_REG10.ST_XL : 0);

		super.writeByte(Register.CTRL_REG10, value);

		this.configureGRes();
		this.configureXLRes();
	}
	
	configureGRes(){
		switch (this.settings.FS_G){
			case CTRL_REG1_G.FS_500DPS:
				this.gres = GRES_VALUES.FS_500DPS;
				break;
			case CTRL_REG1_G.FS_2000DPS:
				this.gres = GRES_VALUES.FS_2000DPS;
				break;
			case CTRL_REG1_G.FS_245DPS:
			default:
				this.gres = GRES_VALUES.FS_245DPS;
				break;
		}
	}
	
	configureXLRes(){
		switch (this.settings.FS_XL){
			case CTRL_REG6_XL.FS_16G:
				this.xlres = XLRES_VALUES.FS_16G;
				break;
			case CTRL_REG6_XL.FS_8G:
				this.xlres = XLRES_VALUES.FS_8G;
				break;
			case CTRL_REG6_XL.FS_2G:
				this.xlres = XLRES_VALUES.FS_2G;
				break;
			case CTRL_REG6_XL.FS_4G:
			default:
				this.xlres = XLRES_VALUES.FS_4G;
				break;
		}
	}
  
	gyroDataAvailable(){
		let status = super.readByte(Register.STATUS_REG);
		return (status & StatusReg.GDA) > 0;
	}
	
	accelDataAvailable(){
		let status = super.readByte(Register.STATUS_REG);
		return (status & StatusReg.XLDA) > 0;
	}
	
	calibrate(){
		let block = this.settings.blocking;
		this.settings.blocking = true;
		const iterations = 20;
		
		let x = 0;
		let y = 0;
		let z = 0;
		for (let i = 0; i < iterations; i++){
				let values = this.sampleGyro();
				x += values.x;
				y += values.y;
				z += values.z;
		}
		this.gxBias = x / iterations;
		this.gyBias = y / iterations;
		this.gzBias = z / iterations;
		
		x = 0;
		y = 0;
		z = 0;
		for (let i = 0; i < iterations; i++){
			let values = this.sampleAccel();
			x += values.x;
			y += values.y;
			z += values.z;
		}
		this.xlxBias = x / iterations;
		this.xlyBias = y / iterations;
		this.xlzBias = z / iterations;
	}
	
  sampleGyro(){
		if (this.settings.blocking){
			let ready = false;
			while (!ready) ready = this.gyroDataAvailable();
		}
	  super.readBlock(Register.OUT_X_L_G, this.readingsBuffer);
		return {
			x: this.view.getInt16(0, true) * this.gres - this.gxBias,
			y: this.view.getInt16(2, true) * this.gres - this.gyBias,
			z: this.view.getInt16(4, true) * this.gres - this.gzBias
		}
  }
	
	sampleAccel(){
		if (this.settings.blocking){
			let ready = false;
			while (!ready) ready = this.accelDataAvailable();
		}
		super.readBlock(Register.OUT_X_XL, this.readingsBuffer);
		return {
			x: this.view.getInt16(0, true) * this.xlres - this.xlxBias,
			y: this.view.getInt16(2, true) * this.xlres - this.xlyBias,
			z: this.view.getInt16(4, true) * this.xlres - this.xlzBias
		}
	}
	
	sample(){
		if (this.operation == "gyro")
			return this.sampleGyro();
		else
			return this.sampleAccel();
	}
}
Object.freeze(AccelerometerGyro.prototype);

class Magnetometer extends SMBus {
	constructor(dictionary){
		super({ ...dictionary, address: 0x1E, hz: 600000});
		
		this.checkIdentification();
		this.readingsBuffer = new ArrayBuffer(6);
		this.view = new DataView(this.readingsBuffer);

		this.settings = {
			TEMP_COMP: false, OM_XY: CTRL_REG1_M.OM_ULTRA, DO: CTRL_REG1_M.DO_80, FAST_ODR: false, ST: false, 	//Control Register 1
			FS: CTRL_REG2_M.FS_4GAUSS, REBOOT: false, SOFT_RST: false, 											//Control Register 2
			I2C_DISABLE: false, LP: false, SIM: false, MD: CTRL_REG3_M.MD_CONTINUOUS, 							//Control Register 3
			OM_Z: CTRL_REG4_M.OM_ULTRA, BLE: CTRL_REG4_M.BLE_LITTLE_ENDIAN,										//Control Register 4
			FAST_READ: false, BDU: false,																		//Control Register 5
			blocking: true
		};

    this.configure({});
  }
	
	checkIdentification(){
		let id = super.readByte(Register.WHO_AM_I_M);
    if (id != 0x3D) throw("unexpected device ID for LSM9DS1 magnetometer");
	}
	
	configure(dictionary){
		Object.assign(this.settings, dictionary);
		let settings = this.settings;
		
		if (settings.I2C_DISABLE){
			settings.I2C_DISABLE = false; //Don't accidentally disable I2C when I2C is the only signal pathway we have.
			throw("Don't disable I2C on the LSM9DS1 in the I2C driver.");
		}
		
		let value;
		value = (settings.TEMP_COMP ? CTRL_REG1_M.TEMP_COMP : 0) | settings.OM_XY | settings.DO | (settings.FAST_ODR ? CTRL_REG1_M.FAST_ODR : 0) | (settings.ST ? CTRL_REG1_M.ST : 0);
		super.writeByte(Register.CTRL_REG1_M, value);
		value = settings.FS | (settings.REBOOT ? CTRL_REG2_M.REBOOT : 0) | (settings.SOFT_RST ? CTRL_REG2_M.SOFT_RST : 0);
		super.writeByte(Register.CTRL_REG2_M, value);
		value = settings.MD | (settings.I2C_DISABLE ? CTRL_REG3_M.I2C_DISABLE : 0) | (settings.LP ? CTRL_REG3_M.LP : 0) | (settings.SIM ? CTRL_REG3_M.SIM : 0);
		super.writeByte(Register.CTRL_REG3_M, value);
		value = settings.OM_Z | settings.BLE;
		super.writeByte(Register.CTRL_REG4_M, value);
		value = (settings.FAST_READ ? CTRL_REG5_M.FAST_READ : 0) | (settings.BDU ? CTRL_REG5_M.BDU : 0);
		super.writeByte(Register.CTRL_REG5_M, value);
	
		switch (settings.FS){
			case CTRL_REG2_M.FS_4GAUSS:
				this.mres = MRES_VALUES.FS_4GAUSS;
				break;
			case CTRL_REG2_M.FS_8GAUSS:
				this.mres = MRES_VALUES.FS_8GAUSS;
				break;
			case CTRL_REG2_M.FS_12GAUSS:
				this.mres = MRES_VALUES.FS_12GAUSS;
				break;
			case CTRL_REG2_M.FS_16GAUSS:
			default:
				this.mres = MRES_VALUES.FS_16GAUSS;
				break;
		}
	}
	
	dataAvailable(){
		let status = super.readByte(Register.STATUS_REG_M);
		return (status & 0b00000111);
	}
	
	sample(){
		if (this.settings.blocking){
			let ready = false;
			while (!ready){
				ready = this.dataAvailable();
			}
		}
		
		let littleEndian = (this.settings.BLE == CTRL_REG4_M.BLE_LITTLE_ENDIAN);
		
		const data = super.readBlock(Register.OUT_X_L_M, this.readingsBuffer);
		return {
			x: this.view.getInt16(0, littleEndian) * this.mres,
			y: this.view.getInt16(2, littleEndian) * this.mres,
			z: this.view.getInt16(4, littleEndian) * this.mres,
		}
	}
}
Object.freeze(Magnetometer.prototype);

class Sensor {
	constructor(dictionary = {}){
		this.magnetometer = new Magnetometer(dictionary);
		this.accelGyro = new AccelerometerGyro(dictionary);
		if (dictionary.operation){
			this.operation = dictionary.operation;
		}else {
			this.operation = "gyro";
		}
	}
	
	sample(){
		switch (this.operation){
			case "gyro":
				return this.accelGyro.sampleGyro();
			case "accelerometer":
				return this.accelGyro.sampleAccel();
			case "magnetometer":
				return this.magnetometer.sample();
			default:
				throw(`Invalid operation for LSM9DS1. Should be one of "gyro", "accelerometer", or "magnetometer".\n`);
		}
	}
	
	configure(dictionary = {}){
		if (dictionary.operation){
			this.operation = dictionary.operation;
			if (this.operation == "gyro" || this.operation == "accelerometer") this.accelGyro.operation = this.operation;
			delete dictionary.operation;
		}
		
		if (this.operation == "gyro" || this.operation == "accelerometer"){
			this.accelGyro.configure(dictionary);
		}else{
			this.magnetometer.configure(dictionary);
		}
	}
	
	close(){
		this.accelGyro.close();
		this.magnetometer.close();
	}
}
Object.freeze(Sensor.prototype);

export {Sensor as default, Control_Register_Values};
