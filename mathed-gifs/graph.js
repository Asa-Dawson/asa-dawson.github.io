let canvas;
let context;

let hintContainer;
let downloadIndicatorContainer;
let imageContainer;
let sizeDisplay;
let gifButton;
let biggerButton;
let smallerButton;

let scale = 256;

let s = Math.sin;
let c = Math.cos;
let t = Math.tan;
let pi = Math.PI;
let e = Math.E;
let cl = (i, l, h) => (i > l ? (i < h ? i : h) : l);
let R = (angle) => angle * (180/pi);
let D = (radians) => radians * (pi/180);
//let di = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
let sq = (base) => Math.pow(base, 2);
let r = (square) => Math.sqrt(square);

let T = new Date().getTime();

let code = "";
let graphingFunction = (x, y, T) => [s(x), c(y), t(T)/2];
const fun = "[t(x)*s(T),t(y)*c(T),t(x+y)-t(T)]";
const fun2 = "[s(di(x, y, 16, 16)*s(T/8)), c(di(x, y, 16, 16)*c(T/16)), t(di(x, y, 16, 16)*t(T/32))]";
const fun3 = "[1-(64*((s(T)*64)%64-di(x, y, 64, 64))/((s(T)*32)%32-di(x, y, 64, 64))),0,0]"

let gif
let recording = false
let frames = 0;
let frameLimit = 60;

const hints = [
    "s, c, t = shorthand for Math.sin, Math.cos, Math.tan",
    "cl = shorthand for clamp(input, lower, higher)",
    "D, R = shorthand to convert to Degrees or Radians respectively",
    "T = current time in milliseconds/1000",
    "[r,g,b] = colour, in range 0.0 - 1.0",
    "x, y = current position",
    "pi, e = shorthand for Math.PI and Math.E",
    "di = shorthand to return distance to a point, distance(x, y)",
    "sq, r = shorthand for Math.pow(input, 2) and Math.sqrt(input) respectively"
];
let hint_index = 0;

const change_scale = (direction) => {
    let oldScale = scale;
    if (direction === 1) {
        scale = (scale*2);
    }
    if (direction === -1) {
        scale = (scale/2);
    }
    if (oldScale !== scale) {
        canvas.width = scale;
        canvas.height = scale;
        context.scale(scale/128, scale/128);
        sizeDisplay.innerHTML = `${scale}`;
    }
}

const updateTime = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    T = new Date().getTime()/1000;
    createGraph(graphingFunction);
    if(recording) {
        updateGif();
    }
};

const updateGif = () => {
    if (frames > frameLimit) {
        frames = 0;
        recording = false;

        gifButton.innerHTML = "💭";
        downloadIndicatorContainer.innerHTML = `Rendering (be patient)`;
        gif.render();
        return;
    }
    gif.addFrame(canvas, {delay: 1000/60});
    gifButton.innerHTML = frames%5 ? '📷' : '💥';
    downloadIndicatorContainer.innerHTML = `Capturing (${frames} frames so far)`;
    frames += 1;
}

const createGraphFunction = (graphText) => {
    return eval(`(x, y, T) => {
        let di = (x2, y2) => Math.sqrt(Math.pow(x-x2,2)+Math.pow(y-y2,2));
        let rgb = ${graphText};
        return rgb;
    }`);
}

const createGraph = (graphFunction) => {
    for (let y = 0; y < 129; y++) {
        for (let x = 0; x < 129; x++) {
            let X = (in_x) => in_x === x ? 1 : 0;
            let Y = (in_y) => in_y === y ? 1 : 0;
            let value = graphFunction(x, y, T);
            context.fillStyle = `rgba(${value[0]*255 || 0}, ${value[1]*255 || 0}, ${value[2]*255 || 0}, 1)`;
            context.fillRect(x, y, 1, 1);
        }
    }
};

const refresh_hint = () => {
    hintContainer.innerHTML = " "+hints[hint_index];
    hint_index = (hint_index + 1)%hints.length;
};

const change_framecount = (count) => {
    frameLimit = cl(count, 60, 300);
    downloadIndicatorContainer.innerHTML = `Set to record ${frameLimit} frames`;
}

const gif_it = () => {
    gif = new GIF({
        workers: 4,
        quality: 11,
        width: scale,
        height: scale
    });

    gifButton.onclick = undefined;
    downloadIndicatorContainer.removeAttribute("href");
    downloadIndicatorContainer.removeAttribute("target");
    downloadIndicatorContainer.classList.remove("bd-success");
    console.log("making gif");

    gif.on('finished', function(blob) {
        //let downloadURL = URL.createObjectURL(blob);
        let formData = new FormData();
        formData.append("upload_preset", "beargifcdn");
        formData.append("file", blob);
        fetch("https://api.cloudinary.com/v1_1/bearcdn/image/upload", {
            method: "post", 
            body: formData 
        }).then(response => {
            return response.json()
        }).then(response => {
            console.log(response);
            gifButton.innerHTML = "🔴";
            downloadIndicatorContainer.innerHTML = "Done! Click to download";
            downloadIndicatorContainer.href = response.url;
            downloadIndicatorContainer.target="_blank";
            downloadIndicatorContainer.download = "animation.gif";
            downloadIndicatorContainer.classList.add("bd-success");

            gifButton.onclick = () => gif_it();
        })
    });

    recording = true;
};

const updateInput = (inputText) => {
    try {
        let x = 0;
        let y = 0;
        let X = () => 1;
        let Y = () => 1;
        let out = eval(`(x, y, T) => {
            let di = (x2, y2) => Math.sqrt(Math.pow(x-x2,2)+Math.pow(y-y2,2));
            let rgb = ${inputText};
            return rgb;
        }`)(x, y, T);
    } catch (e) {
        console.log(e);
        return;
    }
    graphingFunction = createGraphFunction(inputText);
    //code = inputText;
    updateTime();
};

(() => {
    //console.log = function() {}
    canvas = document.getElementById("graphOutput");
    context = graphOutput.getContext('2d');
    context.scale(scale/128, scale/128);
    code = document.getElementById("textInput").value;
    setInterval(updateTime, 1000/60);
    hintContainer = document.getElementById("hintContainer");
    downloadIndicatorContainer = document.getElementById("downloadIndicatorContainer");
    gifButton = document.getElementById("gifButton");
    biggerButton = document.getElementById("biggerButton");
    smallerButton = document.getElementById("smallerButton");
    sizeDisplay = document.getElementById("sizeDisplay");
    imageContainer = document.getElementById("imageContainer");
})();