import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GeoJSON} from 'ol/format';
import KML from 'ol/format/KML.js';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer.js';
import Stamen from 'ol/source/Stamen.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ';
import {MongoRestService} from '../services/mongo-rest.service';

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

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
  airPollutionVector: HeatmapLayer;

  constructor(public  mongoRestService: MongoRestService) {

  }

  ngOnInit() {
    this.initializeMap();
    this.setAirPollutionHeatmap();
  }

  initializeMap() {
    this.source = new XYZ({
      url: 'http://tile.osm.org/{z}/{x}/{y}.png'
    });

    this.mapLayer = new TileLayer({
      source: this.source
    });

    this.map = new Map({
      layers: [this.mapLayer],
      target: 'map',
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });
  }

  setAirPollutionHeatmap() {
    this.mongoRestService.getGeoJSON().subscribe( geoJSON => {
      this.airPollutionVector = new HeatmapLayer({
        source: new VectorSource({
          features: geojsonFormat.readFeatures(geoJSON),
        }),
        blur: 5,
        radius: 15,
        opacity: 0.3,
        renderMode: 'image',
        weight: (feature) => {
          // get your feature property
          var weightProperty = feature.get('leq');
          // perform some calculation to get weightProperty between 0 - 1
          weightProperty = weightProperty / this.maxPollution; // this was your suggestion - make sure this makes sense
          return weightProperty;
        }
      });
      this.airPollutionVector.getSource().on('addfeature', function(event) {
        // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
        // standards-violating <magnitude> tag in each Placemark.  We extract it from
        // the Placemark's name instead.
        var name = event.feature.get('leq');
        var magnitude = parseFloat(name);
        event.feature.set('weight', magnitude);
      });
    });
  }

  removeAirPollutionLayer() {
    this.map.removeLayer(this.airPollutionVector);
  }
  addAirPollutionLayer() {
    this.map.addLayer(this.airPollutionVector);
  }


}
