import { loadComponent } from '../../shared/componentLoader.js';

let map
function updateGeoJSON(map, sourceId, geojsonData) {
  // Remove existing layers and source if they exist
  if (map.getLayer(`${sourceId}-fill`)) {
    map.removeLayer(`${sourceId}-fill`);
  }
  if (map.getLayer(`${sourceId}-outline`)) {
    map.removeLayer(`${sourceId}-outline`);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

  // Add new source
  map.addSource(sourceId, {
    type: 'geojson',
    data: geojsonData // can be a URL or an object
  });

  // Add fill layer
  map.addLayer({
    id: `${sourceId}-fill`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0"), //'#fff',
      'fill-opacity': 0.5
    }
  });

  
  // Add outline layer
  map.addLayer({
    id: `${sourceId}-outline`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#fff',
      'line-width': 2
    }
  });
  
}

loadComponent({
  htmlPath: './components/water-safety/body.html',

  onLoaded: (wrapper) => {
    const select1 = document.getElementById('dijkring1');
    const select2 = document.getElementById('dijkring2');
    for (let i = 1; i <= 3; i++) {
      const opt = new Option(`Dijkring ${i}`, `Dijkring ${i}`);
      select1.appendChild(opt.cloneNode(true));
      select2.appendChild(opt.cloneNode(true));
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoibXVsZGVybmllbHMiLCJhIjoiY21hd2lsbzd3MGRsaTJrczUzZDZqcHk2YSJ9.u_ZMSDYkqT91VxKqYtbdQQ';
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [4.897, 52.372],
      zoom: 13
    });

  },

  onSettings: (settings, wrapper) => {
    fetch('./components/water-safety/data.geojson')
      .then(res => res.json())
      .then(data => {
        if (map.loaded()) {
          updateGeoJSON(map, 'polygon', data);
        } else {
          map.once('load', () => {
            updateGeoJSON(map, 'polygon', data);
          });
        }
      });
  }
});