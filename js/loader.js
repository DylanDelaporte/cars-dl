let game;

function start() {
    game = new Game('canvas');
    game.start();
}

window.onload = start;