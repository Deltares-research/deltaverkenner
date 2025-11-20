import { loadComponent } from '../../shared/componentLoader.js';

let regions
let settings

const chartConfig = {
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
}

const mapConfig = {
  center: [5.3, 52.4], // approx. geographic center of the Netherlands
  zoom: 6,             // starting zoom (inside allowed range)
  style: 'mapbox://styles/mapbox/light-v11',
  minZoom: 6,
  maxZoom: 14
}

let lineChartLeft
let lineChartRight

async function fetchLineChartData(runID, selectedRegion, selectedT) {
  try {
    const response = await fetch(`./data/graphs/fresh-water-shortage-line/${runID}-${selectedRegion}-T${selectedT}.json`);
    return response.ok ? await response.json() : {};
  } catch (err) {
    console.error("Error fetching JSON:", err);
    return {};
  }
}

function syncLineYAxis(charts) {
  // Gather all y-values safely
  const allData = charts.flatMap(c => (c?.data?.datasets || []).flatMap(ds => ds.data || []))
                        .filter(v => v != null);

  if (!allData.length) return;

  const maxY = Math.ceil(Math.max(...allData));

  charts.forEach(c => {
    if (!c?.data?.datasets) return;
    c.options.scales.y.min = 0;
    c.options.scales.y.max = maxY;
    c.update();
  });
}

async function updateLineCharts(leftRunID, rightRunID, selectedRegion, selectedT) {
  // Fetch both chart data in parallel
  const [leftData, rightData] = await Promise.all([
    fetchLineChartData(leftRunID, selectedRegion, selectedT),
    fetchLineChartData(rightRunID, selectedRegion, selectedT)
  ]);

  // Clone data to avoid shared references
  lineChartLeft.data = leftData
  lineChartRight.data = rightData;

  // Sync y-axis
  syncLineYAxis([lineChartLeft, lineChartRight]);
}


//map stuff
let shortageData = null;     // stored geojson
let activeAttr = "2_10";     // default attribute
const sourceId = "shortage"; // shared source name
const fillLayer = "shortage-fill";
const outlineLayer = "shortage-outline";
let mapLeft, mapRight

async function loadShortageData() {
  const resp = await fetch("./data/graphs/shortage.geojson");
  shortageData = await resp.json();
}

function initShortageLayer(map) {
  // Add source once per map
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: shortageData
    });
  }

  // Fill layer
  if (!map.getLayer(fillLayer)) {
    map.addLayer({
      id: fillLayer,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": buildColorExpression(activeAttr),
        "fill-opacity": 0.8
      }
    });
  }

  // Outline layer
  if (!map.getLayer(outlineLayer)) {
    map.addLayer({
      id: outlineLayer,
      type: "line",
      source: sourceId,
      paint: {
        "line-width": 1,
        "line-color": "#666"
      }
    });
  }

}

function buildColorExpression(attr) {
  return [
    "interpolate",
    ["linear"],
    ["get", attr],
    0, "#ffffff",
    5, "#ff0000"
  ];
}

function updateShortageAttribute(attr, map) {
  activeAttr = attr;

  if (map.getLayer(fillLayer)) {
    map.setPaintProperty(
      fillLayer,
      "fill-color",
      buildColorExpression(attr)
    );
  }
}

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

//update mgmt
const updateAll = async () => {
  const selectedRegion = document.getElementById("select-region").value;
  const selectedT = document.getElementById("select-t").value;
  if(!settings || !selectedRegion || !selectedT) {
    return
  }
  await updateLineCharts(settings.state.left.runID, settings.state.right.runID, selectedRegion, selectedT);
  updateShortageAttribute(`${selectedT}_${settings.state.left.runID}`, mapLeft);
  updateShortageAttribute(`${selectedT}_${settings.state.right.runID}`, mapRight);
};


loadComponent({
  htmlPath: './components/fresh-water-shortage/body.html',

  onLoaded: async (wrapper) => {

    lineChartLeft  = new Chart(document.getElementById('left-line' ).getContext('2d'), structuredClone(chartConfig))
    lineChartRight = new Chart(document.getElementById('right-line').getContext('2d'), structuredClone(chartConfig))

    document.getElementById("select-region").onchange = updateAll;
    document.getElementById("select-t").onchange = updateAll;

    fetch('./data/regions.json')
      .then(r => r.json())
      .then(data => {
        const regions = data;
        const select = document.getElementById("select-region");
        const entries = Object.entries(regions);
        entries.forEach(([key, value], index) => {
          const isDefault = index === 0;
          select.add(new Option(value, key, isDefault, isDefault));
        });
        updateAll()
      })

    mapboxgl.accessToken = 'pk.eyJ1IjoibXVsZGVybmllbHMiLCJhIjoiY21hd2lsbzd3MGRsaTJrczUzZDZqcHk2YSJ9.u_ZMSDYkqT91VxKqYtbdQQ';
    
    mapLeft = new mapboxgl.Map({container: 'left-map-shortage', ...mapConfig});
    mapRight = new mapboxgl.Map({container: 'right-map-shortage', ...mapConfig});
    
    await loadShortageData();

    [mapLeft, mapRight].forEach(map => {
      map.on("idle", () => initShortageLayer(map));
      
      map.on("mousemove", "shortage-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features[0];
        const value = feature.properties[activeAttr]; // currently selected attribute
        popup
          .setLngLat(e.lngLat)
          .setHTML(`Tekort ${value !== undefined ? Math.round(value*10)/10 : "N/A"} m3/s`)
          .addTo(map);
      });

      map.on("mouseleave", "shortage-fill", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

    })


  },

  onSettings: async (settings1, wrapper) => {
    settings = settings1
    await updateAll()
  }
});


