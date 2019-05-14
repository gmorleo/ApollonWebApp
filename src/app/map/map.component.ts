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
import {Observable} from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import { fromLonLat, transform } from 'ol/proj';

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  events: string[] = [];
  opened: boolean;

  airPollutionLevel;

  map: Map;
  source: XYZ;
  mapLayer: TileLayer;
  maxPollution = 80;
  airPollutionVector: HeatmapLayer;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );

  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
    this.opened = true;
    this.airPollutionLevel = false;
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
        center: fromLonLat([18.174631, 40.354130]),
        zoom: 6
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

  addAirPollutionLayer() {
    console.log(this.airPollutionLevel);
    if (this.airPollutionLevel == false) {
      this.map.addLayer(this.airPollutionVector);
      //this.airPollutionLevel = true;
    } else {
      this.map.removeLayer(this.airPollutionVector);
      //this.airPollutionLevel = false;
    }
  }

}
