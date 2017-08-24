const HttpClient = function () {
    const ME = this;

    ME.get = function (aUrl, aCallback) {
        let anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            if (anHttpRequest.readyState === 4 && anHttpRequest.status === 200)
                aCallback(anHttpRequest.responseText);
        };

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    };
};

const Photobox = function () {
    const ME = this;
    const BASE_URL = 'http://flashair';
    const COMMAND_ENDPOINT = '/command.cgi';
    const IMAGE_DIR = '/DCIM';
    const TICKRATE = 500;
    const TICKS_UNTIL_RANDOM = 20;
    const BODY_ELEMENT = document.querySelector('body');
    const HTTP_CLIENT = new HttpClient();
    const LIST_ACTION = '?op=100';
    const UPDATE_ACTION = '?op=102';

    let images = [];
    let ticks = 0;

    ME.decodeResponse = function (blob) {
        let result = [];
        let lines = blob.split("\n");

        for (let i = 1; i < lines.length - 1; i++) { // skip first line which is 'WLANSD_FILELIST \n'

            let obj = {};
            let currentline = lines[i].split(","); // <directory>, <filename>, <size>, <attribute>, <date>, <time>

            obj.directory = currentline[0];
            obj.filename = currentline[1];

            result.push(obj);
        }

        return result;
    };

    ME.setBackgroundImage = function (imageUrl) {
        BODY_ELEMENT.setAttribute('style', 'background-image: url(' + imageUrl + ');');
    };

    ME.setRandomImage = function () {
        if (images.length) {
            let randomImage = images[Math.floor(Math.random() * images.length)];
            ME.setBackgroundImage(BASE_URL + randomImage.directory + '/' + randomImage.filename);
            ticks = TICKS_UNTIL_RANDOM / 2;
        }
    };

    ME.updateImages = function (dir, append) {
        const url = BASE_URL + COMMAND_ENDPOINT + LIST_ACTION + '&DIR=' + dir;

        HTTP_CLIENT.get(url, function (response) {
            ME.setImages(response, append);
        });
    };

    ME.setImages = function (blob, append) {
        let decodedImages = ME.decodeResponse(blob);

        if (!append) {
            images = [];
        }

        if (decodedImages[0].size === 0 || decodedImages[0].filename === '100__TSB') {
            for (let i = 0; i < decodedImages.length; i++) {
                if (decodedImages[i].filename !== '100__TSB') {
                    ME.updateImages(decodedImages[i].directory + '/' + decodedImages[i].filename, true);
                }
            }
        } else {
            if (decodedImages.length) {
                images = images.concat(decodedImages);
                ME.setBackgroundImage(BASE_URL + images[images.length - 1].directory + '/' + images[images.length - 1].filename);
            }
        }
    };

    ME.checkForUpdates = function () {
        const url = BASE_URL + COMMAND_ENDPOINT + UPDATE_ACTION;

        HTTP_CLIENT.get(url, function (response) {
            if (response === '1') {
                ME.updateImages(IMAGE_DIR, false);
                ticks = 0;
            } else {
                ticks++;
                if (ticks >= TICKS_UNTIL_RANDOM) {
                    ME.setRandomImage();
                }
            }
            setTimeout(function () {
                ME.checkForUpdates();
            }, TICKRATE);
        });
    };

    ME.init = function () {
        ME.updateImages(IMAGE_DIR, false);
        ME.checkForUpdates();
    };
};

const MY_PHOTOBOX = new Photobox();
MY_PHOTOBOX.init();
