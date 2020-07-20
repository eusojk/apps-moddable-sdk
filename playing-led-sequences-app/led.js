import Digital from "builtin/digital";
import Time from "time";

const FLASH_DURATION = 100;
const TIMEOUT = 5000;
const START_IDLE = new Array(10 * 2 - 1).fill(FLASH_DURATION);
const BETWEEN_IDLES = new Array(5 * 2 - 1).fill(FLASH_DURATION);
const BETWEEN_CYCLES = new Array(10 * 2 - 1).fill(FLASH_DURATION);

class LED extends Digital {
	#replayTimer = undefined;
    #position;
    #sequence;

	constructor(pinNumber){
		super({pin: pinNumber, mode: Digital.Output});
		this.off();
	}

	on(){
		super.write(0);
	}

	off(){
		super.write(1);
    }
    
    play(sequence, callback, blink){
        this.#sequence = sequence;
        this.#position = 0;
        this.playback(callback, blink);
    }

    playback(callback, blink){
		if (this.#position % 2 == 0){
            this.on();
		}else{
			this.off();
		}
		if (this.#position >= this.#sequence.length){
            if (blink) callback.doneBlinking();
			else callback.onReplayEnded();	
			return;
        }
        
        this.#replayTimer = System.setTimeout(id=>{
            this.playback(callback, blink);
        }, this.#sequence[this.#position++]);

    }

    stop(){
		if (this.#replayTimer){
            trace("stop idle called \n")
			System.clearTimeout(this.#replayTimer);
			this.off();
			this.#replayTimer = undefined;
		}
	}
	
}

class SequenceLED extends LED {
    #sequenceUnit = [];
    #idleLED;
    #timeoutTimer;
    #playing = false;
    #lastEventTime = 0;

    constructor(led){
        super(2);
        this.#idleLED = led;
    }

    monitorButton(state){
        if (!this.#playing){
			this.#sequenceUnit.push((Time.ticks - this.#lastEventTime))
            this.#lastEventTime = Time.ticks;
            
            if (state === 1){
                this.off();
                this.setTimeoutTimer();
            } 
            else{
                this.#idleLED.stop();
                this.on();
                this.resetTimeoutTimer();
            } 
        }
    }
	
	setTimeoutTimer(){
		this.#timeoutTimer = System.setTimeout(id => {
			trace("time out: 10 s\n");
			this.#timeoutTimer = undefined;
			this.sequenceEndDetected();
		}, TIMEOUT);
	}
	
	resetTimeoutTimer(){
		if (this.#timeoutTimer !== undefined){
			System.clearTimeout(this.#timeoutTimer);
			this.#timeoutTimer = undefined;
		} 
    }
    
    sequenceEndDetected(){
        this.#playing = true;
        this.#sequenceUnit.push(TIMEOUT/10);
        this.#sequenceUnit.shift(0);
        this.#idleLED.addSequenceUnit(this.#sequenceUnit);
        trace(`${JSON.stringify(this.#idleLED.traceInfo())}\n`);
        this.play(this.#sequenceUnit, this, false)
    }
    
    onReplayEnded(){
        this.#playing = false;
        this.#sequenceUnit = [];
        this.off();
        this.#idleLED.start();
    }
}

class IdleLED extends LED {
    #sequences = [];
    #position;
    #phase;
    #playAgain;

    constructor(){
        super(16);
    }

    start(){
        this.#position = 0;
        this.#phase = 1;
        this.#playAgain = false;
        trace("\n START_IDLE \n");
        this.play(START_IDLE, this, true);
    }

    flashBetweenCycles(){
        trace("\nflashBetweenCycles \n");
        this.play(BETWEEN_CYCLES, this, true);
    }

    flashBetweenIdles(){
        trace("\nflashBetweenIdles \n");
        this.play(BETWEEN_IDLES, this, true);
    }

    playUnit(){
        this.play(this.#sequences[this.#position], this, false);
    }

    donePlayingUnit(){
        this.#position++;
        if (this.#position === this.#sequences.length-1){
            if (!this.#playAgain){
                this.#phase = 3;
            } else {
                this.#phase = 4;
            }
        } 
        this.playUnit();
    }

    doneBlinking(){
        if (this.#phase === 1) {
            trace("\n sortByFirstPress \n");
            if (this.#sequences.length === 1) {
                this.#phase = 3;
            }else {
                this.#phase = 2;
            }
            this.#sequences.sort(this.sortByFirstPress);
            this.playUnit();
        }
        else if (this.#phase === 2) {
            this.donePlayingUnit();
        }
        else if (this.#phase === 3) {
            trace("\n sortByPressCount \n");
            if (this.#sequences.length === 1) {
                this.#phase = 4;
            }else {
                this.#phase = 2;
            }
            this.#playAgain = true;
            this.#position = 0;
            this.#sequences.sort(this.sortByPressCount);
            this.playUnit();
        }
    }

    onReplayEnded(){
        if (this.#phase === 2) {
            this.flashBetweenIdles();
        }
        else if (this.#phase === 3) {
            this.flashBetweenCycles();
        }
        else if (this.#phase === 4) {
            this.start();
        }
    }

    sortByFirstPress(sequence1, sequence2){
        if (sequence1.length && sequence2.length){
            return sequence1[0] - sequence2[0];
        }
        else return 0;
    }

    sortByPressCount(sequence1, sequence2){
        let press1 = Math.ceil(sequence1.length / 2);
        let press2 = Math.ceil(sequence2.length / 2);
        return press1 - press2;
    }

    addSequenceUnit(unit){
        this.#sequences.push(unit);
    }

    traceInfo(){
        trace(`${JSON.stringify(this.#sequences)}\n`);
    }
}

export {SequenceLED, IdleLED};
