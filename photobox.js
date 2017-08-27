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
    const THUMBNAIL_ENDPOINT = '/thumbnail.cgi';
    const IMAGE_DIR = '/DCIM';
    const TICKRATE = 500;
    const TICKS_UNTIL_RANDOM = 20;
    const HTTP_CLIENT = new HttpClient();
    const LIST_ACTION = '?op=100';
    const UPDATE_ACTION = '?op=102';
    const BODY = document.querySelector('body');

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

    ME.getThumbnailUrl = function (imagePath) {
        return BASE_URL + THUMBNAIL_ENDPOINT + '?' + imagePath;
    };

    ME.displayImage = function (imagePath) {
        let currentImages = document.querySelectorAll('.fullscreen');
        let thumbEl = document.createElement('div');
        let thumbImg = new Image();
        let imageEl = document.createElement('div');
        let imageImg = new Image();

        thumbImg.src = ME.getThumbnailUrl(imagePath);
        imageImg.src = BASE_URL + imagePath;

        thumbImg.onload = function() {
            thumbEl.classList.add('in');
        };

        imageImg.onload = function() {
            imageEl.classList.add('in');
            Array.prototype.forEach.call(currentImages, function (node) {
                node.remove();
            });
        };

        thumbEl.classList.add('fullscreen');
        thumbEl.setAttribute('style', 'background-image: url(' + ME.getThumbnailUrl(imagePath) + ');');

        imageEl.classList.add('fullscreen');
        imageEl.setAttribute('style', 'background-image: url(' + BASE_URL + imagePath + ');');

        BODY.appendChild(thumbEl);
        BODY.appendChild(imageEl);
    };

    ME.setRandomImage = function () {
        if (images.length) {
            let randomImage = images[Math.floor(Math.random() * images.length)];
            ME.displayImage(randomImage.directory + '/' + randomImage.filename);
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
                ME.displayImage(images[images.length - 1].directory + '/' + images[images.length - 1].filename);
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
