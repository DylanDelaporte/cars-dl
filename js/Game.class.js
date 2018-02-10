class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');

        this.trackData = null;

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
                console.log(image.width, image.height, that.canvas.width, that.canvas.height);

                let width = image.width;
                let height = image.height;

                if (image.width > that.canvas.clientWidth && image.width > image.height) {
                    width = that.canvas.width;
                    height = (image.height / image.width) * width;
                }
                else if (image.height > that.canvas.clientHeight) {
                    height = that.canvas.height;
                    width = (image.width / image.height) * height;
                }

                console.log('final size', width, height);

                that.context.drawImage(image, 0, 0, width, height);
                that.trackData = that.context.getImageData(0, 0, width, height);

                //finding spawn
                let widthFound = 0, heightFound = 0, lastHeightFound = 0, xFound = 0, yFound = 0, firstTime = true;
                for (let x  = 0; x < that.trackData.width; x++) {
                    heightFound = 0;

                    for (let y = 0; y < that.trackData.height; y++) {
                        const pixel = that.getColorAtIndex(x, y);

                        if (pixel[0] < 50 && pixel[1] > 210 && pixel[2] < 50) {
                            if (firstTime) {
                                xFound = x;
                                yFound = y;

                                firstTime = false;
                            }
                            //console.log(pixel, x, y);
                            //that.context.fillStyle = '#000000';
                            //that.context.fillRect(x, y, 5, 5);
                            //break;

                            heightFound++;
                        }
                    }

                    if (heightFound > 0) {
                        widthFound++;
                        lastHeightFound = heightFound;
                    }
                }

                console.log(widthFound, lastHeightFound, xFound, yFound);
            }
        }
        else {
            this.continueStart();
        }
    }

    continueStart() {
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

    getColorAtIndex(x, y) {
        const red = y * (this.trackData.width * 4) + x * 4;
        return [this.trackData.data[red], this.trackData.data[red + 1], this.trackData.data[red + 2], this.trackData.data[red + 3]];
    }

    /**
     * Distance from given position to the first pixel found in the defined direction
     * @param x position
     * @param y position
     * @param direction string (top, bottom, left, right)
     */
    nearestPixelAt(x, y, direction) {
        let distance = 0;

        switch (direction) {
            case "top":
                while (y > 0) {
                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y--;
                    distance++;
                }
                break;
            case "bottom":
                while (y < this.trackData.height) {
                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y++;
                    distance++;
                }
                break;
            case "left":
                while (x > 0) {
                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x--;
                    distance++;
                }
                break;
            case "right":
                while (x < this.trackData.width) {
                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x++;
                    distance++;
                }
                break;
        }

        return distance;
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