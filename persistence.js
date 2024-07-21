class Persistence {
    constructor() {
        this.audios = this.loadAudios();
    }

    loadAudios() {
        const strAudios = localStorage.getItem("audios");
        if (!strAudios) return [];
        let parsedAudios;
        try {
            parsedAudios = JSON.parse(strAudios);
        } catch ({ name, message }) {
            if (name == "SyntaxError") return [];
        }
        return parsedAudios;
    }

    setAudios(newAudios) {
        localStorage.setItem("audios", JSON.stringify(newAudios));
    }

    getAudioIds() {
        return this.audios.map((audio) => audio.id);
    }

    addAudio(audio_id, deleteHash) {
        this.audios.push({
            id: audio_id,
            deleteHash: deleteHash,
        });
        this.setAudios(this.audios);
    }

    rmAudio(audio_id) {
        let hasRemoved = false;
        for (let i = 0; i < this.audios.length; i++) {
            const audio = this.audios[i];
            if (audio_id == audio.id) {
                this.audios.splice(i, 1);
                hasRemoved = true;
                break;
            }
        }
        if (hasRemoved) {
            this.setAudios(this.audios);
        }
    }

    getAudio(audio_id) {
        for (let i = 0; i < this.audios.length; i++) {
            const audio = this.audios[i];
            if (audio_id == audio.id) return audio;
        }
    }

    getDeleteHash(audio_id) {
        for (let i = 0; i < this.audios.length; i++) {
            const audio = this.audios[i];
            if (audio_id == audio.id) return audio.deleteHash;
        }
    }
}
