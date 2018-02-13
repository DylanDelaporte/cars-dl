let game = null;

function start() {
    /*
    game = new Game('canvas', 'cars', 'track05.jpg', 'car.png');
    game.start();
    game.setFPS(350);
    */

    //LOADING TRACKS
    const trackSelector = document.getElementById('trackSelector');

    for (let i = 5; i > 0; i--) {
        const option = document.createElement("option");
        option.value = "track0" + i + ".jpg";
        option.text = "Track " + i;

        trackSelector.add(option);
    }

    //SETTING FORM SUBMIT EVENT
    const form = document.getElementById('playForm');

    form.onsubmit = function () {
        console.log(this.track.value, this.population.value);

        if (game != null) {
            game.stop();
        }

        game = new Game('canvas', 'cars', this.track.value, 'car.png');
        game.setFPS(this.fps.value);
        game.start();

        return false;
    };

    document.getElementById('stopButton').onclick = function () {
        if (game != null) {
            game.stop();
        }
    };

    //form.submit();
}

window.onload = start;