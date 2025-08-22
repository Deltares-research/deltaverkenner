import { loadComponent } from '../../shared/componentLoader.js';

let map
let floodedChart
let zichtjaren
let clickedBuurt

loadComponent({
  htmlPath: './components/water-safety/body.html',

  onLoaded: (wrapper) => {

  const ctx = document.getElementById('flooded-chart').getContext('2d');
  floodedChart = new Chart(ctx, {
    type: 'line',
    data: { 
      labels: [], 
      datasets: []
    },
    options: { 
      responsive: true,
      scales: {
        y: {
          type: 'logarithmic',
          reverse: true,
          title: {
            display: true,
            text: 'Terugkeertijd (jaren)'
          }
        }
      }
    }
  })
    
	mapboxgl.accessToken = 'pk.eyJ1IjoibXVsZGVybmllbHMiLCJhIjoiY21hd2lsbzd3MGRsaTJrczUzZDZqcHk2YSJ9.u_ZMSDYkqT91VxKqYtbdQQ';
    const map = new mapboxgl.Map({
      container: 'map',
      center: [5.3, 52.4], // approx. geographic center of the Netherlands
      zoom: 7,             // starting zoom (inside allowed range)
      style: 'mapbox://styles/mapbox/light-v11',
      minZoom: 7,
      maxZoom: 14
    });

    const legend = new LegendControl();
    map.addControl(legend, 'bottom-right');

    const dieptes = [2, 20, 50, 100, 150, 200];
    let combinations = {};
    
    // Populate tijdlijn select
    const tijdlijnSelect = document.getElementById('tijdlijn');
    const variantSelect = document.getElementById('variant');
    const zichtjaarSelect = document.getElementById('zichtjaar');
    const diepteSelect = document.getElementById('diepte');

    Promise.all([
      fetch('./data/combinations.json').then(r => r.json()) //path
    ]).then(([data]) => {
      combinations = data;

      // Populate tijdlijn
      Object.keys(combinations).forEach(t =>
        tijdlijnSelect.add(new Option(t, t))
      );

      // Populate variant (all unique)
      const variants = [...new Set(
        Object.values(combinations).flatMap(v => Object.keys(v))
      )];
      variants.forEach(v => variantSelect.add(new Option(v, v)));

      // Populate zichtjaar (all unique)
      zichtjaren = [...new Set(
        Object.values(combinations).flatMap(v => Object.values(v)).flatMap(z => Object.keys(z))
      )];
      zichtjaren.forEach(z => zichtjaarSelect.add(new Option(z, z)));

      // Populate diepte
      dieptes.forEach(d => diepteSelect.add(new Option(d + ' cm', d)));

      // Set defaults
      tijdlijnSelect.value = 'gematigd'
      zichtjaarSelect.value = '2100'

      // Attach listeners
      tijdlijnSelect.addEventListener('change', updateMap);
      variantSelect.addEventListener('change', updateMap);
      zichtjaarSelect.addEventListener('change', updateMap);
      diepteSelect.addEventListener('change', updateMap);

      floodedChart.data.labels = zichtjaren
      floodedChart.update()

    });

    function updateMap() {
      const tijdlijn = tijdlijnSelect.value;
      const variant = variantSelect.value;
      const zichtjaar = zichtjaarSelect.value;
      const diepte = diepteSelect.value;

      const combinatie = combinations[tijdlijn][variant][zichtjaar];
      if(combinatie === undefined) {
        alert("Invalid combination: " + [tijdlijn, variant, zichtjaar].join(" / "));
      }
      const attribute = `${diepte} cm_${combinatie}`;
      console.log(combinatie, attribute)

      map.setPaintProperty('flooded-fill', 'fill-color', [
        "step",
        ["get", attribute],
        "#aaaaaa",
        0, "#FF2600",        // < 30
        30, "#FF8500",    // 30 - 300
        300, "#FFD900",   // 300 - 3,000
        3000, "#C5DA00",  // 3,000 - 30,000
        30000, "#619900"  // > 30,000
      ]);

      updateChart()
    }

    function updateChart() {
      if(!clickedBuurt) {
        return
      }
      const props = clickedBuurt

      const tijdlijnen = Object.keys(combinations);

      const diepte = diepteSelect.value; // current diepte chosen by user
      const variant = variantSelect.value

      document.querySelector('#map-click').innerHTML = `Terugkeertijd in jaren voor een overstroming van <b>${diepte}cm</b> in <b>buurt ${props.BU_NAAM}</b> bij toepassen van maatregel <b>${variant}</b>.`

      const datasets = tijdlijnen.filter(i => i !== 'referentie').map(tijdlijn => {
        const values = zichtjaren.map(zj => {
          const tijdlijn_ = zj === zichtjaren[0] ? 'referentie' : tijdlijn // start each line at referentie value
          const combi = combinations[tijdlijn_][variant][zj];
          const attr = `${diepte} cm_${combi}`;
          const value = props[attr]
          return value === 0 ? 1 : props[attr]; //todo niet meer nodig in nw shape
        });

        return {
          label: tijdlijn,
          data: values,
          tension: 0.1
        };
      });

      // Update chart
      floodedChart.data.labels = zichtjaren;
      floodedChart.data.datasets = datasets;
      floodedChart.update();

    }


    map.on('load', () => {

      map.addSource('flooded', {
        type: 'vector',
        tiles: [
        'https://maps.nielslab.nl/deltaverkenner/map-9/{z}/{x}/{y}.pbf'
        ],
        minzoom: 7,
        maxzoom: 13,
        //scheme: 'tms' // tell Mapbox that this is bottom-left origin
      });

      map.addLayer({
        id: 'flooded-fill',
        type: 'fill',
        source: 'flooded',
        'source-layer': 'flooded',
        paint: {
          'fill-opacity':.6,
        },
        metadata: {
          name: 'Herhalingstijd',
          unit: ' Jaar',
          labels: {
            other: false,
          }
        }
      });

      updateMap()

      map.on('click', 'flooded-fill', function (e) {
        if (e.features.length > 0) {
          clickedBuurt = e.features[0].properties;
          updateChart()
        }
      })

    })

  },

});