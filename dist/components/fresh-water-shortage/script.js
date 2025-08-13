import { loadComponent } from '../../shared/componentLoader.js';

let chart

loadComponent({
  htmlPath: './components/fresh-water-shortage/body.html',

  onLoaded: (wrapper) => {

    async function init() {
      const res = await fetch('/data/scenario-1.json');
      const data = await res.json();

      const time = data.time;
      const regions = Object.keys(data.region);

      // Populate time selects
      const startSel = document.getElementById('period_start');
      const endSel = document.getElementById('period_end');
      time.forEach((t, i) => {
        startSel.add(new Option(t, i));
        endSel.add(new Option(t, i));
      });
      startSel.value = time.length - 36*2;
      endSel.value = time.length - 1;

      // Populate region select
      const regionSel = document.getElementById('region_select');
      regions.forEach(r => regionSel.add(new Option(r, r)));
      regionSel.value = regions[0];

      const ctx = document.getElementById('myChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: { responsive: true }
      });

      function updateChart() {
        const startIdx = parseInt(startSel.value);
        const endIdx = parseInt(endSel.value);
        const region = regionSel.value;

        const labels = time.slice(startIdx, endIdx + 1);
        const rData = data.region[region];

        const doorspoeling_vraag = rData.doorspoeling.vraag.slice(startIdx, endIdx + 1);
        const beregening_vraag = rData.beregening.vraag.slice(startIdx, endIdx + 1);
        const peilbeheer_vraag = rData.peilbeheer.vraag.slice(startIdx, endIdx + 1);

        const tekort = rData.doorspoeling.vraag.map((_, i) => {
          const totalVraag =
            rData.doorspoeling.vraag[i] +
            rData.beregening.vraag[i] +
            rData.peilbeheer.vraag[i];
          const totalLevering =
            rData.doorspoeling.levering[i] +
            rData.beregening.levering[i] +
            rData.peilbeheer.levering[i];
          return Math.max(totalVraag - totalLevering, 0);
        }).slice(startIdx, endIdx + 1);

        chart.data.labels = labels;
        chart.data.datasets = [
          { label: 'Doorspoeling Vraag', data: doorspoeling_vraag, borderColor: 'blue', fill: false },
          { label: 'Beregening Vraag', data: beregening_vraag, borderColor: 'green', fill: false },
          { label: 'Peilbeheer Vraag', data: peilbeheer_vraag, borderColor: 'black', fill: false },
          { label: 'Tekort', data: tekort, borderColor: 'red', fill: false }
        ];
        chart.update();
      }

      startSel.addEventListener('change', updateChart);
      endSel.addEventListener('change', updateChart);
      regionSel.addEventListener('change', updateChart);

      updateChart();
    }

    init();

  }
});