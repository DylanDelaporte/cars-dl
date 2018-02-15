class Game {
    constructor(canvasId, tableId, trackName, carName) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');

        this.trackName = trackName;
        this.trackData = null;

        this.carName = carName;
        this.carImage = null;

        this.fps = 1;

        this.pauseDraw = false;
        this.stopDraw = true;

        this.geneticDeep = new GeneticDeep({
            network: [5, [100], 2],
            population: 20,
            mutationRate: 0.5,
            crossOverFactor: 0.5/*,
            activation: function (value, layer, layers) {
                if (layer === 0) // input mapping
                    return value;
                else if (layer < layers.length - 1) // hidden layers
                    return 1 / (1 + Math.pow(Math.E, -4 * value));
                else // output layer
                    return value;
            }
            /*
            elitism: 0.3,
            crossOverFactor: 0.6
            */
        });

        this.cars = [];
        this.maxSizeCar = {width: 0, height: 0};
        this.spawn = {x: 0, y: 0, angle: 0};

        this.countGenerations = 0;

        this.table = document.querySelector('#' + tableId + ' tbody');
        this.spanCountGeneration = document.getElementById('countGenerations');
        this.spanCountAlive = document.getElementById('countAlive');
        this.spanCountPopulation = document.getElementById('countPopulation');

        this.spanCountPopulation.innerText = this.geneticDeep.options.population;

        this.loaded = false;
    }

    setFPS(fps) {
        this.fps = fps;
    }

    start() {
        if (!this.loaded) {
            const that = this;

            function loadTrack() {
                const image = new Image();
                image.src = 'tracks/' + that.trackName;

                image.onload = function () {
                    that.canvas.style.height = (window.innerHeight - 100) + 'px';

                    that.canvas.width = that.canvas.offsetWidth;
                    that.canvas.height = window.innerHeight;

                    let width = that.canvas.width;
                    let height = (image.height / image.width) * width;

                    if (height > that.canvas.height) {
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

                        that.spawn = that.maxDistanceCollision(xFound, yFound, xFound + widthFound, yFound)
                        > that.maxDistanceCollision(xFound + widthFound, yFound, xFound, yFound) ?
                            {x: xFound, y: yFound, angle: 0} : {x: xFound + widthFound, y: yFound, angle: 180};
                    }
                    else {
                        that.maxSizeCar = {width: lastHeightFound, height: widthFound};

                        that.spawn = that.maxDistanceCollision(xFound, yFound, xFound, yFound + lastHeightFound) >
                        that.maxDistanceCollision(xFound, yFound + lastHeightFound, xFound, yFound) ?
                            {x: xFound + widthFound / 2, y: yFound, angle: 270} : {x: xFound + widthFound / 2, y: yFound + lastHeightFound, angle: 90};
                    }

                    that.continueStart();
                }
            }

            this.carImage = new Image();
            this.carImage.src = 'tiles/' + that.carName;

            this.carImage.onload = loadTrack;


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

            this.table.innerHTML = '';

            for (let i = 0; i < networks.length; i++) {
                const tr = document.createElement('tr');
                tr.id = 'car-row' + i;
                tr.innerHTML = '<th>' + (i + 1) + '</th><td class="small">--</td><td class="small">--</td><td class="small">--</td><td class="small">--</td>';

                this.table.appendChild(tr);

                let car = new Game.Car(networks[i], {
                    position: {x: this.spawn.x, y: this.spawn.y},
                    size: {width: this.maxSizeCar.width, height: this.maxSizeCar.height},
                    angle: this.spawn.angle,
                    rowTable : document.getElementById('car-row' + i)
                });

                this.cars.push(car);
            }
        }

        this.pauseDraw = false;
        this.stopDraw = false;

        this.countGenerations++;
        this.spanCountGeneration.innerText = this.countGenerations;

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

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

            //this.context.drawImage(this.carImage, 0, -height/2, width, /*(this.carImage.height / this.carImage.width) * width*/height);

            this.context.rotate(-angle*Math.PI/180);
            this.context.translate(-posX, -(posY + height/2));

            let computedX = posX + (width * Math.cos(car.angle*Math.PI/180));
            let computedY = posY + (height/2) - (width * Math.sin(car.angle*Math.PI/180));

            this.context.fillStyle = '#ff1a27';
            this.context.fillRect(computedX, computedY, 3, 3);

            let xB = posX - ((height/2)*Math.sin((car.angle)*Math.PI/180));
            let yB = posY + (height/2) - ((height/2)*Math.cos((car.angle)*Math.PI/180));



            this.context.fillRect(xB, yB, 3, 3);

            let xD = computedX - posX + xB;
            let yD = computedY - (posY + (height/2)) + yB;

            let computedX2 = posX + ((width/2) * Math.cos(car.angle*Math.PI/180));
            let computedY2 = posY + (height/2) - ((width/2) * Math.sin(car.angle*Math.PI/180));

            this.context.fillRect(computedX2, computedY2, 3, 3);

            let xH = computedX2 - posX + xB;
            let yH = computedY2 - (posY + (height/2)) + yB;

            this.context.fillRect(xH, yH, 3, 3);

            this.context.fillRect(xD, yD, 3, 3);

            let xE = posX + ((height/2)*Math.sin((car.angle)*Math.PI/180));
            let yE = posY + (height/2) + ((height/2)*Math.cos((car.angle)*Math.PI/180));

            let xG = computedX2 - (xH - computedX2);
            let yG = computedY2 - (yH - computedY2);

            this.context.fillRect(xE, yE, 3, 3);
            this.context.fillRect(xG, yG, 3, 3);

            let xF = computedX - (xD - computedX);
            let yF = computedY - (yD - computedY);

            this.context.fillRect(xF, yF, 3, 3);

            let sensor1 = this.maxDistanceCollision(computedX, computedY, xD, yD);
            let sensor2 = this.maxDistanceCollision(xB, yB, xD, yD);
            let sensor3 = this.maxDistanceCollision(posX, (posY + (height/2)), computedX, computedY);
            let sensor4 = this.maxDistanceCollision(xE, yE, xF, yF);
            let sensor5 = this.maxDistanceCollision(computedX, computedY, xF, yF);

            //let sensor6 = this.maxDistanceCollision(xH, yH, xG, yG);
            //let sensor7 = this.maxDistanceCollision(xG, yG, xH, yH);
            //let sensor8 = this.maxDistanceCollision(xB, yB, xE, yE);
            //let sensor9 = this.maxDistanceCollision(xE, yE, xB, yB);
            //let sensor10 = this.maxDistanceCollision(xD, yD, xB, yB);
            //let sensor11 = this.maxDistanceCollision(xF, yF, xE, yE);
            //let sensor12 = this.maxDistanceCollision(xB, yB, xF, yF);
            //let sensor13 = this.maxDistanceCollision(xE, yE, xD, yD);

            if (sensor1 > 50) sensor1 = 50;
            if (sensor2 > 50) sensor2 = 50;
            if (sensor3 > 50) sensor3 = 50;
            if (sensor4 > 50) sensor4 = 50;
            if (sensor5 > 50) sensor5 = 50;

            //console.log(sensor1, sensor2, sensor3, sensor4, sensor5);

            if (sensor1 < 1 || sensor2 < 1 || sensor5 < 1/* || sensor6 < 1 || sensor7 < 1/* || sensor6 < 1*/) {
                //console.log("collision");
                car.alive = false;
                countDead++;
            }

            const outputs = car.network.compute([sensor1, sensor2, sensor3, sensor4, sensor5/**//*, sensor6, sensor7/*, sensor8, sensor9, sensor10, sensor11*//*, sensor12, sensor13*/]);

            const distance = car.drive(outputs[0], outputs[1]);

            if (car.rowTable !== null) {
                car.rowTable.children[1].innerText = Game.cutText(sensor1, 3) + ' '
                    + Game.cutText(sensor2, 3) + ' '
                    + Game.cutText(sensor3, 3) + ' '
                    + Game.cutText(sensor4, 3) + ' '
                    + Game.cutText(sensor5, 3);

                car.rowTable.children[2].innerText = Game.cutText(outputs[0], 3) + ' ' + Game.cutText(outputs[1], 3);
                car.rowTable.children[3].innerText = Game.cutText(distance, 3, true);
                car.rowTable.children[4].innerText = Game.cutText(car.score, 3);

                if (!car.alive)
                    car.rowTable.classList.add('table-dark');
            }
        }

        this.spanCountAlive.innerText = (this.cars.length - countDead);

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

    static cutText(text, size, noPoints) {
        text = '' + text;

        const index = text.indexOf('.');
        return text.length > 3 ? index !== -1 && !noPoints ? text.substr(0, index) : text.substr(0, size) : text;
    }

    getColorAtIndex(x, y) {
        const red = y * (this.trackData.width * 4) + x * 4;
        return [this.trackData.data[red], this.trackData.data[red + 1], this.trackData.data[red + 2], this.trackData.data[red + 3]];
    }

    maxDistanceCollision(x1, y1, x2, y2) {
        let distance = 0;
        let sizeRect = 1;

        if (x1 === x2) {
            console.log('same x');

            if (y1 > y2) {
                let y = parseInt(y2);
                x1 = parseInt(x1);

                while (y > 0) {
                    const pixel = this.getColorAtIndex(x1, y);

                    this.context.fillRect(x1, y, sizeRect, sizeRect);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y--;
                    distance++;
                }
            }
            else {
                let y = parseInt(y2);
                x1 = parseInt(x1);

                while (y < this.trackData.height) {
                    const pixel = this.getColorAtIndex(x1, y);

                    this.context.fillRect(x1, y, sizeRect, sizeRect);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    y++;
                    distance++;
                }
            }
        }
        else if (y1 === y2) {
            if (x1 > x2) {
                let x = parseInt(x2);
                y1 = parseInt(y1);

                while (x > 0) {
                    const pixel = this.getColorAtIndex(x, y1);

                    this.context.fillRect(x, y1, sizeRect, sizeRect);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x--;
                    distance++;
                }
            }
            else {
                let x = parseInt(x2);
                y1 = parseInt(y1);

                while (x < this.trackData.width) {
                    const pixel = this.getColorAtIndex(x, y1);

                    this.context.fillRect(x, y1, sizeRect, sizeRect);

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

            let x = parseInt(x2);
            let y;

            if (x2 > x1) {
                while (x < this.trackData.width) {
                    y = parseInt((a*x) + b);

                    //console.log(x, y, a, b);

                    this.context.fillRect(x, y, sizeRect, sizeRect);

                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x++;
                    distance++;
                }
            }
            else {
                while (x > 0) {
                    y = parseInt((a*x) + b);

                    if (y > y2) {
                        y = y2 + (y - y2);
                    }

                    this.context.fillRect(x, y, sizeRect, sizeRect);

                    const pixel = this.getColorAtIndex(x, y);

                    if (pixel[0] < 150 && pixel[1] < 150 && pixel[2] < 150)
                        break;

                    x--;
                    distance++;
                }
            }
            distance = Math.sqrt(Math.pow(y - y2, 2) + Math.pow(x - x2, 2));
        }

        return distance;
    }
}

Game.Car = class {
    constructor(network, options) {
        this.position = {x: 0, y: 0};
        this.lastPosition = this.position;

        this.size = {height: 15, width: 30};

        this.angle = 0;

        this.alive = true;

        this.network = network;
        this.score = 0;

        this.rowTable = null;

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

        /*
        const distance = Math.sqrt(
            Math.pow(newPosition.y - this.position.y, 2) + Math.pow(newPosition.x - this.position.x, 2));
            */

        const distance = Game.Car.distance(this.position.x, this.position.y, newPosition.x, newPosition.y);

        //console.log(distance(newPosition.x, newPosition.y, this.lastPosition.x, this.lastPosition.y));

        if (Game.Car.distance(this.lastPosition.x, this.lastPosition.y, newPosition.x, newPosition.y) < 0.5) {
            //console.log('killed', distance);
            this.alive = false;
        }

        //TODO: calculate score if car goes back
        this.score += distance;

        //console.log('drive', newPosition, this.position, newAngle, distance, this.score);

        this.lastPosition = this.position;
        this.position = newPosition;

        this.angle = newAngle;

        return Game.Car.distance(newPosition.x, newPosition.y, this.lastPosition.x, this.lastPosition.y);
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    }
};

Game.Wall = class {
    constructor(options) {

    }
};