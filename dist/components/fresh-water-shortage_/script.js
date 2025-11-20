import { loadComponent } from '../../shared/componentLoader.js';
import {Sankey} from "https://muldernielsdeltares.github.io/SankeyRiver/sankey.min.js"


loadComponent({
  htmlPath: './components/fresh-water-shortage/body.html',

  onLoaded: (wrapper) => {

    function mean(arr) {
      if (arr.length === 0) return 0; // avoid division by 0
      const sum = arr.reduce((acc, val) => acc + val, 0);
      return sum / arr.length;
    }

    async function init() {
      const res = await fetch('./data/scenario-1.json');
      const data = await res.json();

      const time = data.time;
      const regions = Object.keys(data.region);

      // Populate time selects
      //const startSel = document.getElementById('period_start');
      //const endSel = document.getElementById('period_end');
      const periodSel = document.getElementById('period');
      time.forEach((t, i) => {
        //startSel.add(new Option(t, i));
        //endSel.add(new Option(t, i));
        if (t.indexOf('-01-01')>0) {
          periodSel.add(new Option(t.substring(0,4), i));
        }
      });
      //startSel.value = time.length - 36*2;
      //endSel.value = time.length - 1;
      periodSel.value = time.length-36

      // Populate region select
      const regionSel = document.getElementById('region_select');
      regions.forEach(r => regionSel.add(new Option(r, r)));
      regionSel.value = regions[0];

      const datasetsCfg = {
        pointRadius: 0,         // hide dots/points
        tension: 0.1            // smooth the line (0 = straight, 1 = very curvy)
      }
      const ctx = document.getElementById('myChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: { 
          labels: [], 
          datasets: []
        },
        options: { 
          responsive: true,
          scales: {
            y: {
              title: {
                display: true,
                text: 'm³/s'
              }
            }
          }
        }
      })
      //sankey
      const sankeyCfg = {
        nodeConfig: {
          Beschikbaar: {style:{fill:"lightblue"}},
          Vraag: {style:{fill:"lightblue"}},
          Tekort: {style:{fill:"red"}},
          Beregening: {style:{fill:"green"}},
          Peilbeheer: {style:{fill:"black"}},
          Doorspoeling: {style:{fill:"blue"}},
        },
        flowBaseConfig: {
          tooltip: (flow) => `${flow.from} &rarr; ${flow.to}: ${Math.round(flow.value*100)/100} m³/s`
        },
        nodeBaseConfig: {
          label: {text: (node) => `${node.id} (${Math.round(node.size*100)/100} m³/s)`},
          tooltip: null,
        },
        margin: [10,10,10,10],
      }


      function updateChart() {
        //data processing
        //const startIdx = parseInt(startSel.value);
        //const endIdx = parseInt(endSel.value);
        const startIdx = parseInt(periodSel.value);
        const endIdx = startIdx+36-1;
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

        const dryestPeriod = tekort.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
        const dryestMonthStart = Math.floor((dryestPeriod) / 3) * 3;
        
        console.log(dryestPeriod, dryestMonthStart)

        //line
        chart.data.labels = labels;
        chart.data.datasets = [
          { label: 'Doorspoeling Vraag', data: doorspoeling_vraag, borderColor: 'blue', ...datasetsCfg },
          { label: 'Beregening Vraag', data: beregening_vraag, borderColor: 'green', ...datasetsCfg },
          { label: 'Peilbeheer Vraag', data: peilbeheer_vraag, borderColor: 'black', ...datasetsCfg },
          { label: 'Tekort', data: tekort, borderColor: 'red', ...datasetsCfg }
        ];
        chart.update();

        console.log(chart.data)

        document.getElementById('sankeyDesc').innerHTML = 
        `In ${time[periodSel.value].substring(0,4)} was ${dryestMonthStart/3+1} de maand met het grootste tekort. Onderstaande Sankey laat de balans zien voor die maand.`


        //sankey
        const beschikbaar = doorspoeling_vraag.map((_, i) => doorspoeling_vraag[i] + beregening_vraag[i] + peilbeheer_vraag[i] - tekort[i]);

        const flows = [
          { from: "Beschikbaar", to: "Vraag", value: mean(beschikbaar.slice(dryestMonthStart,dryestMonthStart+3)), style:{fill:"lightblue"}},
          { from: "Tekort", to: "Vraag", value: mean(tekort.slice(dryestMonthStart,dryestMonthStart+3)), style:{fill:"red"}},
          { from: "Vraag", to: "Beregening", value: mean(beregening_vraag.slice(dryestMonthStart,dryestMonthStart+3)), style:{fill:"blue"}},
          { from: "Vraag", to: "Peilbeheer", value: mean(peilbeheer_vraag.slice(dryestMonthStart,dryestMonthStart+3)), style:{fill:"blue"}},
          { from: "Vraag", to: "Doorspoeling", value: mean(doorspoeling_vraag.slice(dryestMonthStart,dryestMonthStart+3)), style:{fill:"blue"}},
        ]

        new Sankey('sankey-area', {flows, ...sankeyCfg})
      }

      //startSel.addEventListener('change', updateChart);
      //endSel.addEventListener('change', updateChart);
      periodSel.addEventListener('change', updateChart);
      regionSel.addEventListener('change', updateChart);

      updateChart();
    }

    init();

  }
});