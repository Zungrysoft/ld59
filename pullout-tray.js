import { getSavedHint } from "./src/save.js";
import { checkTranscription } from "./src/transcribing.js";

class PulloutTray extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        :host {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 33.3333%;
          display: block;
          overflow: clip;
          z-index: 999;
          pointer-events: none;
        }

        .tray {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
          background: #333333;
          border-top: 1px solid #aaa;
          transform: translateY(100%);
          transition: transform 0.3s ease, background-color 0.2s ease;
          padding: 12px 0 12px 12px;
          pointer-events: auto;
        }

        .tray.open {
          transform: translateY(0);
        }

        .tray.flash-green {
          background-color: #2f6b2f;
        }

        .column {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 16px;
          flex: 2;
        }

        .tray-inner {
          flex: 8;
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 10px;
        }

        .main-box {
          width: 100%;
          flex: 1;
          resize: none;
          overflow: auto;
          min-height: 0;
          padding: 8px;
          font-size: 16px;
          font-family: Courier;
          background-color: #464646;
          color: #e2e2e2;
        }

        .button-row {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-bottom: 16px;
        }

        .button-row .button {
          flex: 1;
          margin-bottom: 0;
        }

        .text {
          height: 10px;
          margin: 0px;
          padding: 0px;
          user-select: none;
          color: #e2e2e2;
          font-family: Courier;
        }

        .button {
          padding: 8px;
          color: #e2e2e2;
          background-color: #464646;
          font-family: Courier;
          margin-bottom: 16px;
        }
      </style>

      <div class="tray">
        <div class="tray-inner">
          <textarea class="main-box" placeholder="Enter text here..."></textarea>
        </div>
        <div class="column">
          <div class="button-row">
            <button class="button transcription-button transcription-a" disabled>A</button>
            <button class="button transcription-button transcription-b" disabled>B</button>
            <button class="button transcription-button transcription-c" disabled>C</button>
          </div>
          <button class="button check-button">Check Transcription</button>
          <p class="text"></p>
        </div>
      </div>
    `;

    this.tray = shadow.querySelector(".tray");
    this.mainBox = shadow.querySelector(".main-box");
    this.button = shadow.querySelector(".check-button");
    this.textBox = shadow.querySelector(".text");

    this.transcriptionButtons = [
      shadow.querySelector(".transcription-a"),
      shadow.querySelector(".transcription-b"),
      shadow.querySelector(".transcription-c"),
    ];

    this.transcriptionButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        this.onTranscriptionButtonClicked(index);
      });
    });

    this.mainBox.addEventListener("input", () => {
      this.onTextEdited(this.mainBox.value);
    });

    this.button.addEventListener("click", () => {
      const text = this.getTopBoxText();
      if (text.length > 0) {
        const [response, shouldClear] = checkTranscription(text);
        this.setResponseText(response);
        if (shouldClear) {
          this.setInputText("");
        }
      }
    });
  }

  open() {
    this.tray.classList.add("open");
    this.isOpen = true;
  }

  close() {
    this.tray.classList.remove("open");
    this.isOpen = false;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    }
    else {
      this.open();
    }
  }

  setResponseText(text, status=null) {
    this.textBox.textContent = text;

    if (status === 'success') {
      this.tray.classList.remove("flash-green");
      void this.tray.offsetWidth;
      this.tray.classList.add("flash-green");

      clearTimeout(this.flashTimeout);
      this.flashTimeout = setTimeout(() => {
        this.tray.classList.remove("flash-green");
      }, 200);
    }
  }

  

  getTopBoxText() {
    return this.mainBox.value;
  }

  onTextEdited(newText) {
  }

  onTranscriptionButtonClicked(index) {
    this.setSelectedTranscription(index);
  }

  setNewTapeData(tape, tapeId) {
    this.tape = tape;
    this.tapeId = tapeId;
    this.selectedTranscription = 0;

    this.updateState();
  }

  setInputText(text) {
    this.text = text;

    this.updateState();
  }

  setSelectedTranscription(selectedTranscription) {
    this.selectedTranscription = selectedTranscription;

    this.updateState();
  }

  updateState() {
    this.text = getSavedHint(this.tapeId, this.selectedTranscription);
    this.mainBox.value = this.text;
    const transcriptionCount = this.tape?.transcriptions?.length
    this.transcriptionButtons.forEach((button, index) => {
      button.disabled = index >= transcriptionCount || index === this.selectedTranscription;
    });
  }
}

customElements.define("pullout-tray", PulloutTray);