// shared/componentLoader.js
import { settingsStore } from './settingsStore.js';

export async function loadComponent({
  containerId = 'components-container',
  htmlPath,
  onLoaded = () => {},
  onSettings = () => {}
}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found`);
    return;
  }

  try {
    const response = await fetch(htmlPath);
    const html = await response.text();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    // Custom logic after component is added
    onLoaded(wrapper);

    // React to settings changes
    settingsStore.subscribe(settings => {
      onSettings(settings, wrapper);
    });
  } catch (err) {
    console.error(`Failed to load component from ${htmlPath}`, err);
  }
}
