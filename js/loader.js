let game;

function start() {
    game = new Game('canvas');
    game.start();
    game.setFPS(50)
}

window.onload = start;