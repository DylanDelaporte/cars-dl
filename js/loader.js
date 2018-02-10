let game;

function start() {
    game = new Game('canvas');
    game.start();
    game.setFPS(150)
}

window.onload = start;