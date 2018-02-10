let game;

function start() {
    game = new Game('canvas');
    game.start();
    game.setFPS(10)
}

window.onload = start;