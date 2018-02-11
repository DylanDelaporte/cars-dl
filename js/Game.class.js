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
            population: 50,
            /*
            elitism: 0.3,
            crossOverFactor: 0.6
            */
        });

        this.cars = [];
        this.maxSizeCar = {width: 0, height: 0};
        this.spawn = {x: 0, y: 0, angle: 0};

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
                //console.log(image.width, image.height, that.canvas.width, that.canvas.height);

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

                //console.log('final size', width, height);

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

                //console.log(widthFound, lastHeightFound, xFound, yFound);

                if (widthFound > lastHeightFound) {
                    that.maxSizeCar = {width: widthFound, height: lastHeightFound};

                    if (that.nearestPixelAt(xFound, yFound, "left") >
                        that.nearestPixelAt(xFound + widthFound, yFound, "right")) {
                        that.spawn = {x: xFound, y: yFound, angle: 270};
                    }
                    else {
                        that.spawn = {x: xFound, y: yFound, angle: 90};
                    }
                }
                else {
                    that.maxSizeCar = {width: lastHeightFound, height: widthFound};

                    if (that.nearestPixelAt(xFound, yFound, "top") >
                        that.nearestPixelAt(xFound, yFound + lastHeightFound, "bottom")) {
                        //that.spawn = {x: xFound + widthFound / 2, y: yFound + lastHeightFound, angle: 90};
                        that.spawn = {x: xFound + widthFound / 2, y: yFound, angle: 14};
                        //that.spawn = {x: xFound, y: yFound, angle: 270};
                    }
                    else {
                        that.spawn = {x: xFound, y: yFound, angle: 180};
                    }
                }

                //console.log(that.maxSizeCar, that.spawn);

                /*
                let topDistance = that.nearestPixelAt(xFound, yFound, "top");
                let bottomDistance = that.nearestPixelAt(xFound, yFound, "bottom");
                let leftDistance = that.nearestPixelAt(xFound, yFound, "left");
                let rightDistance = that.nearestPixelAt(xFound, yFound, "right");

                if (topDistance > bottomDistance && topDistance > leftDistance && topDistance > rightDistance) {

                }
                */

                that.continueStart();
            }
        }
        else {
            this.continueStart();
        }
    }

    continueStart() {
        if (this.stopDraw) {
            //console.log('setting new network');

            //TODO: error with small population
            const networks = this.geneticDeep.nextGeneration();
            this.cars = [];

            for (let i = 0; i < networks.length; i++) {
                let car = new Game.Car(networks[i], {
                    position: {x: this.spawn.x, y: this.spawn.y},
                    size: {width: this.maxSizeCar.width, height: this.maxSizeCar.height},
                    angle: this.spawn.angle
                });

                this.cars.push(car);
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
        //console.log('drawing');

        this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.context.putImageData(this.trackData, 0, 0);

        let countDead = 0;

        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];

            //if car dead we didn't draw it
            if (!car.alive) {
                countDead++;
                continue;
            }

            //console.log(car.position, car.size, car.angle);

            let angle = -car.angle;
            let posX = car.position.x;
            let posY = car.position.y;
            let width = car.size.width;
            let height = car.size.height;


            this.context.translate(posX, posY + height / 2);
            this.context.rotate(angle*Math.PI/180);
            this.context.fillStyle = '#000000';
            this.context.fillRect(0, - height/2, width, height);
            this.context.fillStyle = '#ff0000';
            this.context.fillRect(-1, -1, 2, 2);

            this.context.rotate(-angle*Math.PI/180);
            this.context.translate(-posX, -(posY + height/2));

            let computedX = posX + (width * Math.cos(car.angle*Math.PI/180));
            let computedY = posY + (height/2) - (width * Math.sin(car.angle*Math.PI/180));

            //console.log('computed position', computedX, computedY, car.angle, Math.cos(car.angle*Math.PI/180), Math.sin(car.angle*Math.PI/180));

            this.context.fillStyle = '#00ffff';
            this.context.fillRect(computedX, computedY, 2, 2);

            let computedX90 = posX - (height/2) - (width * Math.cos((car.angle - 90)*Math.PI/180));
            let computedY90 = posY + (height/2) - (width * Math.sin((car.angle - 90)*Math.PI/180));

            //let yB = posX - ((height/2)) * Math.sin(car.angle*Math.PI/180);
            //let xB = posY + height/2 + ((height/2) * Math.sin(car.angle*Math.PI/180));

            let xB = posX - ((height/2)*Math.sin((car.angle)*Math.PI/180));
            let yB = posY + (height/2) - ((height/2)*Math.cos((car.angle)*Math.PI/180));

            this.context.fillRect(xB, yB, 2, 2);

            //console.log('xB', xB, yB, ((height/2)*Math.cos((car.angle + 90)*Math.PI/180)), ((height/2)*Math.sin((car.angle + 90)*Math.PI/180)), Math.sin((car.angle + 90)*Math.PI/180));

            let xD = computedX - posX + xB;
            let yD = computedY - (posY + (height/2)) + yB;

            this.context.fillRect(xD, yD, 2, 2);

            let xE = posX - (xB - posY);
            let yE = (posY + (height/2)) - (yB - (posY + (height/2)));

            let xF = computedX - (xD - computedX);
            let yF = computedY - (yD - computedY);

            this.context.fillRect(xF, yF, 2, 2);

            /*
            let sensor1 = this.nearestPixelAt(xD, yD, "top");
            let sensor2 = this.nearestPixelAt(xD, yD, "left");
            let sensor3 = this.nearestPixelAt(computedX, computedY, "top");
            let sensor4 = this.nearestPixelAt(xF, yF, "top");
            let sensor5 = this.nearestPixelAt(xF, yF, "right");

            let sensor6 = this.nearestPixelAt(computedX, computedY, "bottom");
            */

            let sensor1 = this.maxDistanceCollision(computedX, computedY, xD, yD);
            let sensor2 = this.maxDistanceCollision(xB, yB, xD, yD);
            let sensor3 = this.maxDistanceCollision(posX, (posY + (height/2)), computedX, computedY);
            let sensor4 = this.maxDistanceCollision(xE, yE, xF, yF);
            let sensor5 = this.maxDistanceCollision(computedX, computedY, xF, yF);

            let sensor6 = this.maxDistanceCollision(computedX, computedY, posX, (posY + (height/2)));

            //console.log('xD left', sensor1, this.maxDistanceCollision(computedX, computedY, xD, yD));
            //console.log('xF right', sensor6, this.maxDistanceCollision(computedX, computedY, xF, yF));
            //console.log('computer top', sensor5, this.maxDistanceCollision(posX, (posY + (height/2)), computedX, computedY));

            if (sensor1 > 30) sensor1 = 30;
            if (sensor2 > 30) sensor2 = 30;
            if (sensor3 > 30) sensor3 = 30;
            if (sensor4 > 30) sensor4 = 30;
            if (sensor5 > 30) sensor5 = 30;

            //sensor1 = parseFloat(sensor1);

            if (i === 0) {
                document.getElementById('car0').innerText = sensor1 + ' ' + sensor2 + ' ' + sensor3 + ' ' + sensor4 + ' ' + sensor5;
            }

            if (sensor1 < 1 || sensor2 < 1 || sensor5 < 1 || sensor6 < 1) {
                //console.log("collision");
                car.alive = false;
                countDead++;
            }

            const outputs = car.network.compute([sensor1, sensor2, sensor3, sensor4, sensor5]);

            car.drive(outputs[0], outputs[1]);

            //console.log('inputs', sensor1, sensor2, sensor3, sensor4, sensor5);
            //console.log('outputs', outputs);

            //calculate

        }

        //WORKING TEST
        /*
        var angle = 90 - 90;
        var posX = 10;
        var posY = 10;
        var width = 30;
        var height = 15;


        this.context.translate(posX, posY + height / 2);
        this.context.rotate(angle*Math.PI/180);
        this.context.fillRect(0, - height/2, width, height);
        this.context.fillStyle = '#ff0000';
        this.context.fillRect(-1, -1, 2, 2);

        this.context.rotate(-angle*Math.PI/180);
        this.context.translate(-posX, -(posY + height/2));
        */

        //console.log(countDead >= this.cars.length, countDead);


        //everyone is dead so we stop the game
        if (countDead >= this.cars.length) {
            //console.log('everyone is dead');
            this.stop();
            this.start();
        }
        else {
            if (!this.stopDraw && !this.pauseDraw) {
                const that = this;

                setTimeout(function () {
                    that.draw();
                }, 1000 / this.fps);
            }
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
        //TODO: solve distance calculation problem
        x = parseInt(x);
        y = parseInt(y);

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

    maxDistanceCollision(x1, y1, x2, y2) {
        let distance = 0;

        if (x1 === x2) {
            if (y1 > y2) {
                let y = y2;

                while (y > 0) {
                    const pixel = this.getColorAtIndex(x1, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y--;
                    distance++;
                }
            }
            else {
                let y = y2;

                while (y < this.trackData.height) {
                    const pixel = this.getColorAtIndex(x1, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y++;
                    distance++;
                }
            }
        }
        else if (y1 === y2) {
            if (x1 > x2) {
                let x = x2;

                while (x > 0) {
                    const pixel = this.getColorAtIndex(x, y1);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x--;
                    distance++;
                }
            }
            else {
                let x = x2;

                while (x < this.trackData.width) {
                    const pixel = this.getColorAtIndex(x, y1);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x++;
                    distance++;
                }
            }
        }
        else {
            let a = (y2 - y1) / (x2 - x1);

            let b = y1 - (a*x1);

            //console.log(arguments);
            //console.log('a', a, 'b', b);

            let x = parseInt(x2);
            let y;

            while (x < this.trackData.width) {
                y = parseInt((a*x) + b);

                //console.log(x, y, a, b);

                //this.context.fillRect(x, y, 2, 2);

                const pixel = this.getColorAtIndex(x, y);

                if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                    break;

                //console.log(distance);

                x++;
                distance++;
            }

            distance = Math.sqrt(Math.pow(y - y2, 2) + Math.pow(x - x2, 2));
        }

        return distance;
    }
}

Game.Car = class {
    constructor(network, options) {
        this.position = {x: 0, y: 0};
        this.size = {height: 15, width: 30};

        this.angle = 0;

        this.alive = true;

        this.network = network;
        this.score = 0;

        this.init(options);
    }

    init(options) {
        if (typeof options === "object") {
            const keys = Object.keys(options);

            for (let i = 0; i < keys.length; i++) {
                if (this.hasOwnProperty(keys[i])) {
                    this[keys[i]] = options[keys[i]];
                }
            }
        }
    }

    drive(speed, angle) {
        //TODO: update speed and angle
        const speedPixel = (speed - 0.5) * 4;
        const angleRange = ((angle - 0.5) * 7); //10 degrees angle max per drive call

        //console.log('position', speedPixel, angleRange, Math.cos(angleRange * Math.PI / 180), speedPixel * Math.cos(angleRange * Math.PI / 180));

        let newAngle = this.angle + angleRange;
        newAngle = (newAngle > 359) ? newAngle - 360 : newAngle;

        const newPosition = {
            x: this.position.x + (speedPixel * Math.cos(newAngle * Math.PI / 180)),
            y: this.position.y - (speedPixel * Math.sin(newAngle * Math.PI / 180))
        };

        const distance = Math.sqrt(
            Math.pow(newPosition.y - this.position.y, 2) + Math.pow(newPosition.x - this.position.x, 2));

        if (distance < 0.1) {
            console.log('killed', distance);
            this.alive = false;
        }

        this.score += distance;

        //console.log('drive', newPosition, this.position, newAngle, distance, this.score);

        this.position = newPosition;
        this.angle = newAngle;
    }
};

Game.Wall = class {
    constructor(options) {

    }
};