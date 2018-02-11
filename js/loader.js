let game;

function start() {
    game = new Game('canvas', 'cars', 'track03.jpg');
    game.start();
    game.setFPS(350)
}

window.onload = start;