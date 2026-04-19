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
          transition: transform 0.3s ease;
          padding: 12px 0 12px 12px;
          pointer-events: auto;
        }

        .tray.open {
          transform: translateY(0);
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

        .top-box {
          width: 100%;
          resize: none;
          overflow: auto;
          height: 3.5em;
          line-height: 1.2;
          padding: 8px;
          font-size: 16px;
          font-family: Courier;
          background-color: #464646;
          color: #e2e2e2;
        }

        .bottom-box {
          width: 100%;
          flex: 1;
          resize: both;
          overflow: auto;
          min-height: 60px;
          padding: 8px;
          font-size: 16px;
          font-family: Courier;
          background-color: #464646;
          color: #e2e2e2;
        }

        .text {
          height: 10px;
          margin: 0px;
          padding: 0px;
        }
      </style>

      <div class="tray">
        <div class="tray-inner">
          <textarea class="top-box" placeholder="Enter a transcription here..."></textarea>
          <textarea class="bottom-box" placeholder="Notes"></textarea>
        </div>
        <div class="column">
          <p>dsdds</p>
        </div>
      </div>
    `;

    this.tray = shadow.querySelector(".tray");
    this.topBox = shadow.querySelector(".top-box");
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

  getTopBoxText() {
    return this.topBox.value;
  }
}

customElements.define("pullout-tray", PulloutTray);
