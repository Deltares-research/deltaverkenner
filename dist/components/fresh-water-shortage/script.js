import { loadComponent } from '../../shared/componentLoader.js';

let chart

loadComponent({
  htmlPath: './components/fresh-water-shortage/body.html',

  onLoaded: (wrapper) => {
    const ctx = wrapper.querySelector('#barChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'bar',
      data: {}
    })
  },

  onSettings: (settings, wrapper) => {
    chart.data = {
      labels: ['A', 'B', 'C'],
      datasets: [{
        label: 'Values',
        data: [Math.random()*30, Math.random()*30, Math.random()*30],
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }]
    }
    chart.update()
  }
});