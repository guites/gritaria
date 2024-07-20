const record = document.getElementById("record");
const stop = document.getElementById("stop");
const soundClips = document.getElementById("sound-clips");
const h1 = document.getElementById("h1");
const h2 = document.getElementById("h2");
const buttImg = document.getElementById("butt-img");
const griteSpans = document.querySelectorAll(".grite");

let mediaRecorder;
let isPressed = false;

function toggleSpans(show) {
    griteSpans.forEach((element) => {
        if (show) {
            element.classList.add("active");
        } else {
            element.classList.remove("active");
        }
    });
}

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia supported.");
    const constraints = { audio: true };
    let chunks = [];
    let onSuccess = function (stream) {
        mediaRecorder = new MediaRecorder(stream);

        record.onmouseenter = () => {
            h1.innerText = "Aperte";
        };
        record.onmouseleave = () => {
            if (!isPressed) {
                h1.innerText = "Coloque o dedo";
            }
        };
        record.onmousedown = () => {
            h1.innerText = "Mantenha pressionado";
            isPressed = true;
            if (mediaRecorder.state === "inactive") {
                mediaRecorder.start();
                toggleSpans(true);
            }
        };
        window.onmouseup = (e) => {
            const target = e.target;
            if (isPressed) {
                if (target === record || target === buttImg) {
                    h1.innerText = "Aperte";
                } else {
                    h1.innerText = "Coloque o dedo";
                }
                toggleSpans(false);
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
                isPressed = false;
            }
        };

        mediaRecorder.onstop = (e) => {
            const clipContainer = document.createElement("article");
            const clipLabel = document.createElement("p");
            clipLabel.classList.add("clip-label");
            const audio = document.createElement("audio");
            const deleteButton = document.createElement("button");

            clipContainer.classList.add("clip");
            audio.setAttribute("controls", "");
            deleteButton.textContent = "Delete";
            const numLabels = document.querySelectorAll(".clip-label").length;
            clipLabel.textContent = `gritaria #${numLabels + 1}`;

            clipContainer.appendChild(clipLabel);
            clipContainer.appendChild(audio);
            clipContainer.appendChild(deleteButton);
            soundClips.appendChild(clipContainer);

            const blob = new Blob(chunks, {
                type: mediaRecorder.mimeType,
            });
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            audio.src = audioURL;

            deleteButton.onclick = (e) => {
                let evtTgt = e.target;
                if (confirm("Deletar essa gritaria?")) {
                    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
                }
            };
        };
        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        };
    };
    let onError = function (err) {
        console.log("The following error occured: " + err);
    };
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
    console.log("getUserMedia not supported on your browser!");
}
