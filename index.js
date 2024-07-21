const pbUrl = "https://gritaria.pockethost.io";
const pb = new PocketBase(pbUrl);

const record = document.getElementById("record");
const stop = document.getElementById("stop");
const soundClips = document.getElementById("sound-clips");
const h1 = document.getElementById("h1");
const buttImg = document.getElementById("butt-img");
const griteSpans = document.querySelectorAll(".grite");
const feed = document.getElementById("feed");
const feedbacks = document.getElementById("feedbacks");

let mediaRecorder;
let isPressed = false;

function generateDeleteHash() {
    const array = new Uint32Array(2);
    self.crypto.getRandomValues(array);
    return array.join("");
}

function blockContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function startRecording() {
    h1.innerText = "Mantenha pressionado";
    isPressed = true;
    if (mediaRecorder.state === "inactive") {
        mediaRecorder.start();
        toggleSpans(true);
        record.classList.add("active");
    }
}

function stopRecording(e) {
    const target = e.target;
    if (isPressed) {
        if (target === record || target === buttImg) {
            h1.innerText = "Aperte";
        } else {
            h1.innerText = "Coloque o dedo";
        }
        toggleSpans(false);
        record.classList.remove("active");
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        isPressed = false;
    }
}

function toggleSpans(show) {
    griteSpans.forEach((element) => {
        if (show) {
            element.classList.add("active");
        } else {
            element.classList.remove("active");
        }
    });
}

async function deleteAudio(id, deleteHash) {
    return pb.collection("audios").delete(
        id,
        (options = {
            deleteHash: deleteHash,
        })
    );
}

record.addEventListener("contextmenu", blockContextMenu);
buttImg.addEventListener("contextmenu", blockContextMenu);

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
        record.addEventListener("mousedown", startRecording);
        record.addEventListener("touchstart", startRecording);

        window.addEventListener("mouseup", stopRecording);
        window.addEventListener("touchend", stopRecording);

        mediaRecorder.onstop = async (e) => {
            const clipContainer = document.createElement("article");
            const clipLabel = document.createElement("p");
            clipLabel.classList.add("clip-label");
            const audio = document.createElement("audio");
            const deleteButton = document.createElement("button");

            clipContainer.classList.add("clip");
            audio.setAttribute("controls", "");
            deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
</svg> Deletar`;
            deleteButton.classList.add("delete-button");
            const numLabels = document.querySelectorAll(".clip-label").length;
            clipLabel.textContent = `gritaria #${numLabels + 1}`;

            clipContainer.appendChild(audio);
            clipContainer.appendChild(deleteButton);
            clipContainer.appendChild(clipLabel);
            soundClips.appendChild(clipContainer);

            const blob = new Blob(chunks, {
                type: mediaRecorder.mimeType,
            });
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            audio.src = audioURL;

            const deleteHash = generateDeleteHash();

            // upload file to pocketbase hosting
            const formData = new FormData();
            formData.append("audio", blob);

            const createdAudio = await pb.collection("audios").create(formData);
            await pb.collection("audio_deletehashes").create({
                audio_id: createdAudio.id,
                deleteHash,
            });

            deleteButton.onclick = async (e) => {
                let evtTgt = e.target;
                if (confirm("Deletar essa gritaria?")) {
                    const deletion = await deleteAudio(
                        createdAudio.id,
                        deleteHash
                    );
                    if (!deletion) {
                        // TODO: show error feedback
                        // TODO: do not delete audio node
                    }
                    evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
                }
            };
        };
        mediaRecorder.ondataavailable = function (e) {
            console.log(e);
            chunks.push(e.data);
        };
    };
    let onError = function (err) {
        console.log("The following error occured: " + err);
        const errorDiv = document.createElement("div");
        errorDiv.classList.add("alert", "danger");
        errorDiv.innerHTML =
            "Ei! Você precisa permitir o uso do microfone pra usar o site.";
        errorDiv.id = "navigator-mediadevices-error";
        feedbacks.appendChild(errorDiv);
    };
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
    console.log("getUserMedia not supported on your browser!");
}

function createAudioListItem(file) {
    const audio = document.createElement("audio");
    audio.setAttribute("controls", "");
    audio.id = file.id;
    audio.src = `${pbUrl}/api/files/audios/${file.id}/${file.audio}`;

    const timeTag = document.createElement("time");

    const parsedDate = dateFns.parseISO(file.created);
    timeTag.innerText = dateFns.formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: dateFns.locale.ptBR,
    });
    const li = document.createElement("li");
    li.appendChild(audio);
    li.appendChild(timeTag);
    return li;
}

// list and search for 'audios' collection records
const list = pb
    .collection("audios")
    .getList(1, 100, {
        sort: "-created",
    })
    .then((list) => {
        list.items.forEach((file) => {
            const li = createAudioListItem(file);
            feed.appendChild(li);
        });
    });

pb.collection("audios").subscribe("*", function (e) {
    if (e.action == "create") {
        const li = createAudioListItem(e.record);
        feed.prepend(li);
    }
    if (e.action == "delete") {
        const audio = document.getElementById(e.record.id);
        const li = audio.parentElement;
        li.remove();
    }
});
