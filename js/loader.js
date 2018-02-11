let game;

function start() {
    game = new Game('canvas', 'cars');
    game.start();
    game.setFPS(350)
}

window.onload = start;