"use strict";
(function () {
    const BASE_URL = 'http://flashair';
    const COMMAND_ENDPOINT = '/command.cgi';
    const IMAGE_DIR = '/DCIM';
    const TICKRATE = 500;
    const TICKS_UNTIL_RANDOM = 20;
    const BODY_ELEMENT = document.querySelector('body');

    let images = [];
    let ticks = 0;

    const HttpClient = function () {
        this.get = function (aUrl, aCallback) {
            var anHttpRequest = new XMLHttpRequest();
            anHttpRequest.onreadystatechange = function () {
                if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                    aCallback(anHttpRequest.responseText);
            };

            anHttpRequest.open("GET", aUrl, true);
            anHttpRequest.send(null);
        }
    };

    function decodeResponse(blob) {
        blob = blob.substring(17);

        let result = [];
        let lines = blob.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {

            let obj = {};
            let currentline = lines[i].split(","); // <directory>, <filename>, <size>, <attribute>, <date>, <time>

            obj.directory = currentline[0];
            obj.filename = currentline[1];
            obj.size = currentline[2];
            obj.attribute = currentline[3];
            obj.date = currentline[4];
            obj.time = currentline[5];

            result.push(obj);
        }

        return result;
    }

    function setBackgroundImage(imageUrl) {
        BODY_ELEMENT.setAttribute('style', 'background-image: url(' + imageUrl + ');');
    }

    function setRandomImage() {
        if (images.length) {
            let randomImage = images[Math.floor(Math.random() * images.length)];
            setBackgroundImage(BASE_URL + randomImage.directory + '/' + randomImage.filename);
            ticks = TICKS_UNTIL_RANDOM / 2;
        }
    }

    function updateImages(dir, forceUpdate) {
        const httpClient = new HttpClient();
        const url = BASE_URL + COMMAND_ENDPOINT + '?op=100&DIR=' + dir;

        httpClient.get(url, function (response) {
            setImages(response, forceUpdate);
        });
    }

    function setImages(blob, forceUpdate) {
        let decodedImages = decodeResponse(blob);

        if (decodedImages[0].size === 0 || decodedImages[0].filename === '100__TSB') {
            for (let i = 0; i < decodedImages.length; i++) {
                if (decodedImages[i].filename !== '100__TSB') {
                    updateImages(decodedImages[i].directory + '/' + decodedImages[i].filename, forceUpdate);
                }
            }
        } else {
            images = decodedImages;

            if (images.length && forceUpdate) {
                setBackgroundImage(BASE_URL + images[images.length - 1].directory + '/' + images[images.length - 1].filename);
            }
        }
    }

    function checkForUpdates() {
        const httpClient = new HttpClient();
        const url = BASE_URL + COMMAND_ENDPOINT + '?op=102';

        httpClient.get(url, function (response) {
            if (response === '1') {
                updateImages(IMAGE_DIR, true);
                ticks = 0;
            } else {
                ticks++;
                if (ticks >= TICKS_UNTIL_RANDOM) {
                    setRandomImage();
                }
            }
            setTimeout(function () {
                checkForUpdates();
            }, TICKRATE);
        });
    }

    updateImages(IMAGE_DIR, true);
    checkForUpdates();
})();
