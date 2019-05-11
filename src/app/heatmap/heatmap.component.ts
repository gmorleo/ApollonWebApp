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

  constructor() { }

  ngOnInit() {

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

    var vector = new HeatmapLayer({
      source: new VectorSource({
        url: 'assets/data/2012_Earthquakes_Mag5.geojson',
        format: new GeoJSON({
          extractStyles: false
        })
      }),
      blur: 5,
      radius: 10
    });

    vector.getSource().on('addfeature', function(event) {
      // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
      // standards-violating <magnitude> tag in each Placemark.  We extract it from
      // the Placemark's name instead.
      var name = event.feature.get('name');
      var magnitude = parseFloat(name.substr(2));
      event.feature.set('weight', magnitude - 5);
    });

    var raster = new TileLayer({
      source: new Stamen({
        layer: 'toner'
      })
    });

    var map = new Map({
      layers: [this.mapLayer, vector],
      target: 'map',
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });
  }

}
