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
          z-index: 999;
          overflow: clip;
        }

        .tray {
          width: 100%;
          height: 100%;
          background: #e9ecef;
          border-top: 1px solid #aaa;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          padding: 12px 0 12px 12px;
        }

        .tray.open {
          transform: translateY(0);
        }

        .tray-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 90%;
          gap: 10px;
        }

        .top-box {
          width: 100%;
          resize: none;
          overflow: auto;
          height: 3.4em;
          line-height: 1.2;
          padding: 8px;
          font-size: 16px;
        }

        .bottom-box {
          width: 100%;
          flex: 1;
          resize: both;
          overflow: auto;
          min-height: 60px;
          padding: 8px;
          font-size: 16px;
        }
      </style>

      <div class="tray">
        <div class="tray-inner">
          <textarea class="top-box"></textarea>
          <textarea class="bottom-box"></textarea>
        </div>
      </div>
    `;

    this.tray = shadow.querySelector(".tray");
    this.topBox = shadow.querySelector(".top-box");
  }

  openTray() {
    this.tray.classList.add("open");
    this.open = true;
  }

  closeTray() {
    this.tray.classList.remove("open");
    this.open = false;
  }

  toggleTray() {
    if (this.open) {
      this.closeTray();
    }
    else {
      this.openTray();
    }
  }

  getTopBoxText() {
    return this.topBox.value;
  }
}

customElements.define("pullout-tray", PulloutTray);
