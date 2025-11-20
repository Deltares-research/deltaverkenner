import { loadComponent } from '../../shared/componentLoader.js';

let runs = []

const showZss = (zss, side) => {
  document.getElementById(`zss-${side}`).style.display = zss!==null ? 'block' : 'none'
  if(zss!==null) {
    document.getElementById(`zss-${side}-value`).innerHTML = zss
  }
}

loadComponent({
  htmlPath: './components/sea-level-rise/body.html',

  onLoaded: (wrapper) => {    
    fetch('./data/runs.json')
      .then(r => r.json())
      .then(data => {
        runs = data
      });
  },

  onSettings: (settings, wrapper) => {
    for(let side in settings.state) {
      const cnf = settings.state[side]
      const match = runs.find(row =>
        row.runID === cnf.runID
      );
      const zss =  match ? match.zss : null;
      showZss(zss, side)
    }

  }
});