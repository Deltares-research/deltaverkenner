import { settingsStore } from '../../shared/settingsStore.js';

let runs = []

function createSelects(container, side, config) {
  container.innerHTML = ""; // clean container
  const menu = config.menu.filter(i=>!i.hide)
  const defaults = config.defaults?.[side] || {};

  // Build each select from config.menu
  menu.forEach(item => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("input-group", "mb-3");

      const span = document.createElement("span");
      span.classList.add("input-group-text");
      span.textContent = item.label;
      wrapper.appendChild(span);

      const select = document.createElement("select");
      select.classList.add("form-select");
      select.id = `${side}-${item.id}`;

      item.options.forEach(opt => {
          const option = document.createElement("option");

          if (typeof opt === "string") {
              option.value = opt;
              option.textContent = opt;
          } else {
              option.value = opt.value;
              option.textContent = opt.label;
          }

          select.appendChild(option);
      });

    const defVal = defaults[item.id] ?? item.default;
    if (defVal !== undefined) {
        select.value = String(defVal);
    }

    wrapper.appendChild(select);
    container.appendChild(wrapper);
});

  // Store update function
  const updateStore = () => {
    const newState = {};

    menu.forEach(item => {
      const el = document.getElementById(`${side}-${item.id}`);
      newState[item.id] = el.value;
    });

    const match = runs.find(row =>
      row.klimaat === newState.klimaat &&
      Number(row.zichtjaar) === Number(newState.zichtjaar) &&
      Number(row.afvoerverdeling) === Number(newState.afvoerverdeling) &&
      String(row.afvoerbeperking) === 'false' &&//String(newState.afvoerbeperking) &&
      String(row.kwa) === 'false'//String(newState.kwa)
    );
    newState['runID'] = match ? match.runID : null

    settingsStore.setState(side, newState);
  };

  // Attach change listeners
  menu.forEach(item => {
    const el = document.getElementById(`${side}-${item.id}`);
    el.addEventListener("change", updateStore);
  });

  // Initial store update
  updateStore();
}


// Load config + HTML + build menus
fetch('./config.json')
  .then(res => res.json())
  .then(config => {
    settingsStore.setSettings(config.settings);
    const container = document.getElementById('settings-container');
    fetch('./components/settings/settings.html')
      .then(r => r.text())
      .then(html => {
        container.innerHTML = html;
        createSelects(document.getElementById('left-settings'), 'left', config);
        createSelects(document.getElementById('right-settings'), 'right', config);
      });
  });

fetch('./data/runs.json')
  .then(r => r.json())
  .then(data => {
    runs = data
  });

window.showModal = (content) => {
  fetch(content).then(r => r.text()).then(html => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" tabindex="-1" role="dialog">${html}</div>
    `;

    const modalElement = wrapper.firstElementChild;
    document.body.appendChild(modalElement);

    const bsModal = new bootstrap.Modal(modalElement);
    bsModal.show();

    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
    });
  });
};