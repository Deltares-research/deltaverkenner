import { settingsStore } from '../../shared/settingsStore.js';

function createSelectsOld(container, side, config) {
  container.innerHTML = `
    <label>Scenario</label>
    <select class="form-select mb-2" id="${side}-scenario">
      ${config.scenarios.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    </select>
    <label>Measures</label>
    <select class="form-select" id="${side}-measures" multiple>
      ${config.measures.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    </select>
  `;

  const updateStore = () => {
    const scenario = document.getElementById(`${side}-scenario`).value;
    const measures = Array.from(document.getElementById(`${side}-measures`).selectedOptions).map(o => o.value);
    settingsStore.setState(side, { scenario, measures });
  };

  container.querySelectorAll('select').forEach(el => el.addEventListener('change', updateStore));

  document.getElementById(`${side}-scenario`).value = config.defaults[side].scenario;
  const select = document.getElementById(`${side}-measures`);
  Array.from(select.options).forEach(opt => {
    opt.selected = config.defaults[side].measures.includes(opt.value);
  });

  updateStore();
}

function createSelects(container, side, config) {
  container.innerHTML = `
    <label>Scenario</label>
    <select class="form-select mb-2" id="${side}-scenario">
      ${config.scenarios.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    </select>
    <label class="form-label">Maatregelen</label>
    <div class="card rounded-2">
      <div class="card-body" id="${side}-measures">
        ${config.measures.map((opt, i) => `
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="${opt.value}" id="${side}-opt${i}">
            <label class="form-check-label" for="${side}-opt${i}">${opt.label}</label>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const updateStore = () => {
    const scenario = document.getElementById(`${side}-scenario`).value;
    const checkboxes = container.querySelectorAll('.form-check-input');
    const measures = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    settingsStore.setState(side, { scenario, measures });
  };

  const checkboxes = container.querySelectorAll('.form-check-input');
  checkboxes.forEach(cb => {
    cb.checked = config.defaults[side].measures.includes(cb.value);
    cb.addEventListener('change', updateStore);
  });

  
  const el = document.getElementById(`${side}-scenario`)
  el.value = config.defaults[side].scenario;
  el.addEventListener('change', updateStore);

  updateStore();
}


fetch('./config.json')
  .then(res => res.json())
  .then(config => {
    settingsStore.setSettings(config.settings)
    const container = document.getElementById('settings-container');
    fetch('./components/settings/settings.html')
      .then(r => r.text())
      .then(html => {
        container.innerHTML = html;
        createSelects(document.getElementById('left-settings'), 'left', config);
        createSelects(document.getElementById('right-settings'), 'right', config);
      });
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