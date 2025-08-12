import { loadComponent } from '../../shared/componentLoader.js';

let map

loadComponent({
  htmlPath: './components/water-safety/body.html',

  onLoaded: (wrapper) => {

    
	mapboxgl.accessToken = 'pk.eyJ1IjoibXVsZGVybmllbHMiLCJhIjoiY21hd2lsbzd3MGRsaTJrczUzZDZqcHk2YSJ9.u_ZMSDYkqT91VxKqYtbdQQ';
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        center: [5,52], // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 7 // starting zoom
    });

    map.on('load', () => {
      map.addSource('neighbourhoods_nl', {
        type: 'vector',
        tiles: [
        'https://deltaresdata.openearth.eu/geoserver/gwc/service/tms/1.0.0/deltaverkenner:neighbourhoods_nl@EPSG:900913@pbf/{z}/{x}/{y}.pbf'
        ],
        minzoom: 0,
        maxzoom: 14,
        scheme: 'tms' // tell Mapbox that this is bottom-left origin
      });

      map.addLayer({
        id: 'neighbourhoods_nl-fill',
        type: 'fill',
        source: 'neighbourhoods_nl',
        'source-layer': 'neighbourhoods_nl', // ← update this after checking
        paint: {
          'fill-color': [
            'interpolate',
            ['exponential', 1],//['linear'],
            ['get', 'AANT_INW'], // numeric column from your shapefile
            0, '#ffff00',        // yellow at 0
            6000, '#800080'      // purple at 6000
          ],
          'fill-opacity': 0.6,
          //'fill-outline-color': '#333'
        }
      });

      map.on('click', 'neighbourhoods_nl-fill', function (e) {
        if (e.features.length > 0) {
          const props = e.features[0].properties;
          document.querySelector('#map-click').innerHTML = `Het aantal inwoners van buurt ${props.BU_NAAM} (gemeente ${props.GM_NAAM}) is ${props.AANT_INW}.`
        }
      })

    })

  },

});