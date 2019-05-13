import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GeoJSON} from 'ol/format';
import KML from 'ol/format/KML.js';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer.js';
import Stamen from 'ol/source/Stamen.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ';

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit {

  map: Map;
  source: XYZ;
  mapLayer: TileLayer;
  maxPollution = 80;
  vector: HeatmapLayer;

  constructor() {

  }

  ngOnInit() {
    var blur = document.getElementById('blur');
    var radius = document.getElementById('radius');


    this.source = new XYZ({
      url: 'http://tile.osm.org/{z}/{x}/{y}.png'
    });

    this.mapLayer = new TileLayer({
      source: this.source
    });

/*    var vector = new HeatmapLayer({
      source: new VectorSource({
        url: 'assets/data/kml/2012_Earthquakes_Mag5.kml',
        format: new KML({
          extractStyles: false
        })
      }),
      blur: 5,
      radius: 10
    });*/

    this.vector = new HeatmapLayer({
      source: new VectorSource({
        //url: 'assets/data/apollon500.geojson',
        url: 'http://localhost:8090/test/getGeo',

        format: new GeoJSON({
          extractStyles: false
        })
      }),
      blur: 5,
      radius: 15,
      opacity: 0.3,
      renderMode: 'image',
      weight: (feature) => {
        // get your feature property
        var weightProperty = feature.get('weight');
        // perform some calculation to get weightProperty between 0 - 1
        weightProperty = weightProperty /this.maxPollution; // this was your suggestion - make sure this makes sense
        return weightProperty;
      }
    });

    this.vector.getSource().on('addfeature', function(event) {
      // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
      // standards-violating <magnitude> tag in each Placemark.  We extract it from
      // the Placemark's name instead.
      var name = event.feature.get('leq');
      var magnitude = parseFloat(name);
      event.feature.set('weight', magnitude);
    });

    var raster = new TileLayer({
      source: new Stamen({
        layer: 'toner'
      })
    });


    this.map = new Map({
      layers: [this.mapLayer],
      target: 'map',
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });

    blur.addEventListener('input', ()=> {
      // @ts-ignore
      this.vector.setBlur(parseInt(blur.value, 10));
    });

    radius.addEventListener('input', () => {
      // @ts-ignore
      this.vector.setRadius(parseInt(radius.value, 10));
    });
  }


  remove() {
    this.map.removeLayer(this.vector);
  }
  add() {
    this.map.addLayer(this.vector);
  }
}
