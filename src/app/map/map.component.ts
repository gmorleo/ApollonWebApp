import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GeoJSON} from 'ol/format';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ';
import {MongoRestService} from '../services/mongo-rest.service';
import {Observable, Observer} from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import { fromLonLat, transform , transformExtent} from 'ol/proj';
import {toObservable} from '@angular/forms/src/validators';
import {Box} from '../models/box';

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

const lecce = fromLonLat([18.174631, 40.354130]);
const default_zoom = 10;
const minZoom = 3;
const maxZoom = 17;
const maxPollution =0.7;


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  events: string[] = [];
  opened: boolean = true;
  showSpinner: boolean = false;

  airPollutionLevel: boolean = false;
  airPollutionLevelRidotti: boolean = false;
  airPollutionSettings: boolean = false;

  days = ["12/05","13/05","14/05","15/05","16/05","17/05","18/05","19/05"];
  date = [];

  map: Map;

  airPollutionVector: HeatmapLayer;
  airPollutionVectorRidotti: HeatmapLayer;

  zoom: any;
  box: any;

/*  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );*/

  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
  }

  ngOnInit() {
    this.initializeMap();
  }

  initializeMap() {
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new XYZ({url: 'http://tile.osm.org/{z}/{x}/{y}.png'})
        })
      ],
      target: 'map',
      view: new View({
        center: lecce,
        zoom: default_zoom,
        minZoom: minZoom,
        maxZoom: maxZoom
      })
    });

    this.zoom = this.map.getView().getZoom();
    this.box = this.getViewSize();

    this.map.on('moveend', (evt) => {
      var map = evt.map;
      var zoom = map.getView().getZoom();
      if (this.airPollutionLevelRidotti) {
        this.addAirPolutionheatmap();
      }
    });
  }

  addAirPolutionheatmap() {
    var zoom = this.map.getView().getZoom();
    var box = this.getViewSize();
    if ((Math.abs(this.zoom-zoom) > 1 || ((this.box[0]-1)-box[0] > 0) || ((this.box[1]-1)-box[1] > 0) || ((this.box[2]+1)-box[2] < 0) || ((this.box[3]+1)-box[3] < 0)) && (zoom < 14)) {
      this.showSpinner = true;
      this.map.removeLayer(this.airPollutionVectorRidotti);
      this.setAirHeatmapVector(zoom,box).subscribe( res => {
        this.map.addLayer(this.airPollutionVectorRidotti);
        this.showSpinner = false;
      });
      this.zoom = zoom;
      this.box = box;
    }
  }

  setAirHeatmapVector(zoom,box) {
    return new Observable( observer => {
      this.mongoRestService.getGeoJSONRidotti(zoom,box[0]-1,box[1]-1,box[2]+1,box[3]+1).subscribe(geoJSON => {
        this.airPollutionVectorRidotti = new HeatmapLayer({
          source: new VectorSource({
            features: geojsonFormat.readFeatures(geoJSON),
          }),
          blur: 20,
          radius: 20,
          opacity: 0.3,
          renderMode: 'image',
          weight: (feature) => {
            var weightProperty = feature.get('leq');
            weightProperty = weightProperty / maxPollution; // perform some calculation to get weightProperty between 0 - 1
            return weightProperty;
          }
        });
        observer.next(true);
        observer.complete();
      });
    })
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
          weightProperty = weightProperty / maxPollution; // this was your suggestion - make sure this makes sense
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
    if (this.airPollutionLevel == false) {
      this.map.addLayer(this.airPollutionVector);
    } else {
      this.map.removeLayer(this.airPollutionVector);
    }
  }

  setTravelTimeDate() {
    this.mongoRestService.getDate().subscribe( res => {
      this.date = res;
    })
  }

  showAirPollutionSettings() {
    this.airPollutionSettings = !this.airPollutionSettings;
  }

  setRadiusSize(event) {
    this.airPollutionVectorRidotti.setRadius(event.value);
  }

  setBlurSize(event) {
    this.airPollutionVectorRidotti.setBlur(event.value);
  }

  setOpacity(event) {
    this.airPollutionVectorRidotti.setOpacity(event.value);
  }

  changeDate() {
    if (this.airPollutionLevel) {
      this.setAirPollutionHeatmap();
    }
  }

  addAirPollutionLayerRidotti() {
    var zoom = this.map.getView().getZoom();
    var box = this.getViewSize();
    if (this.airPollutionLevelRidotti == false) {
      this.showSpinner = true;
      this.setAirHeatmapVector(zoom,box).subscribe( res => {
        this.map.addLayer(this.airPollutionVectorRidotti);
        this.showSpinner = false;
      });
    } else {
      this.map.removeLayer(this.airPollutionVectorRidotti);

    }
  }

  getViewSize():any {
    var glbox = this.map.getView().calculateExtent(this.map.getSize());
    var box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
    return box;
  }
}
