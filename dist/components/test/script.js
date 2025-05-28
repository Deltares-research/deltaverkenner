import { loadComponent } from '../../shared/componentLoader.js';

loadComponent({
  htmlPath: './components/test/body.html',

  onLoaded: (wrapper) => {
  },

  onSettings: (settings, wrapper) => {
    const pre = wrapper.querySelector('#json');
    pre.innerHTML = JSON.stringify(settings, null, 2)
  }
});