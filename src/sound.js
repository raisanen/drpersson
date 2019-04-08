import { Audio } from 'expo';
const availableSounds = {
    break: require('../assets/audio/break.wav'),
    coin: require('../assets/audio/coin.wav'),
    theme: require('../assets/audio/main.mp3'),
    die: require('../assets/audio/die.wav'),
    flagpole: require('../assets/audio/flagpole.wav'),
    jump: require('../assets/audio/jump.wav'),
};

export class PerssonSound {
    constructor(name, preload = true) {
        this.source = availableSounds[name];
        this.sound = new Audio.Sound();

        this.isLoaded = false;
        this.isStarting = false;
        this.isLoading = false;
        this.playQueued = null;

        this.loadSound = async () => {
            this.isLoading = true;
            try {
                await this.sound.loadAsync(this.source);
            } catch (e) {
                console.log(e);
            } finally {
                this.isLoaded = true;
                this.isLoading = false;
                if (this.playQueued) {
                    await this.play(this.playQueued.loop, this.playQueued.volume);
                }
            }
        };
        if (preload) {
            this.loadSound();
        }
    }

    async play(loop = false, volume = 0.9) {
        if (this.isStarting) {
            return;
        } else if (this.isLoading) {
            this.playQueued = { loop: loop, volume: volume };
            return;
        }

        this.isStarting = true;
        this.playQueued = null;

        if (!this.isLoaded) {
            await this.loadSound();
        }
        try {
            await this.sound.setStatusAsync({ isLooping: loop, volume: volume });
            await this.sound.playAsync();    
        } catch (e) {
            console.log(e);
        } finally {
            this.isStarting = false;
        }
    }

    async pause() {
        if (!this.isLoaded) {
            return;
        }
        try {
            await this.sound.pauseAsync();
        } catch (e) {
            console.log(e);
        }
    }
}

export class PerssonPlayer {
    constructor() {
        this.sounds = {
            break: new PerssonSound('break', true),
            coin: new PerssonSound('coin', true),
            theme: new PerssonSound('theme', true),
            flagpole: new PerssonSound('flagpole', true),
            die: new PerssonSound('die', true),
            jump: new PerssonSound('jump', true),
        };
    }

    async play(name, pauseOther = null) {
        if (pauseOther && this.sounds.hasOwnProperty(pauseOther)) {
            await this.sounds[pauseOther].pause();
        }
        await this.sounds[name].play();
    }

    async pause(name) {
        await this.sounds[name].pause();
    }
}
