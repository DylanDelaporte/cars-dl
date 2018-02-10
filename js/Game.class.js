class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');

        this.fps = 1;

        this.pauseDraw = false;
        this.stopDraw = true;

        this.geneticDeep = new GeneticDeep({
            network: [5, [4, 3], 2],
            population: 20
        });

        this.cars = [];

        this.loaded = false;
    }

    setFPS(fps) {
        this.fps = fps;
    }

    start() {
        if (!this.loaded) {
            const that = this;

            const image = new Image();
            image.src = 'tracks/track01.jpg';

            image.onload = function () {
                console.log(image.width);
            }
        }
        else {
            this.continueStart();
        }

    }

    private continueStart() {
        if (this.stopDraw) {
            console.log('setting new network');

            const networks = this.geneticDeep.nextGeneration();
            this.cars = [];

            for (let i = 0; i < networks.length; i++) {
                this.cars.push(new Game.Car(networks[i]));
            }
        }

        this.pauseDraw = false;
        this.stopDraw = false;

        this.draw();
    }

    pause() {
        this.pauseDraw = true;
    }

    stop() {
        this.stopDraw = true;

        for (let i = 0; i < this.cars.length; i++) {
            this.geneticDeep.networkScore(this.cars[i].network, this.cars[i].score);
        }
    }

    draw() {
        console.log('drawing');

        let countDead = 0;

        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];

            //if car dead we didn't draw it
            if (!car.alive) {
                countDead++;
                return;
            }
        }

        //everyone is dead so we stop the game
        if (countDead >= this.cars.length) {
            this.stop();
        }

        if (!this.stopDraw && !this.pauseDraw) {
            const that = this;

            setTimeout(function () {
                that.draw();
            }, 1000 / this.fps);
        }
    }
}

Game.Car = class {
    constructor(network, options) {
        this.position = {x: 0, y: 0};
        this.size = {height: 15, width: 30};

        this.alive = true;

        this.network = network;
        this.score = 0;

        this.init(options);
    }

    init(options) {
        if (typeof options === Object) {
            for (let key in Object.keys(options)) {
                if (this.hasOwnProperty(key)) {
                    this[key] = options[key];
                }
            }
        }
    }
};

Game.Wall = class {
    constructor(options) {

    }
};