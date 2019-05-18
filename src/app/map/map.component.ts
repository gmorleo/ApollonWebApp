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

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

const lecce = fromLonLat([18.174631, 40.354130]);
const minZoom = 3;
const maxZoom = 17;
const maxPollution = 80;


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  events: string[] = [];
  opened: boolean;

  airPollutionLevel: boolean;
  airPollutionLevelRidotti: boolean;
  airPollutionSettings: boolean;

  days = ["12/04","13/04","14/04","15/04","16/04","17/04","18/04","19/04"];
  date = [];

  map: Map;
  source: XYZ;
  mapLayer: TileLayer;
  airPollutionVector: HeatmapLayer;
  airPollutionVectorRidotti: HeatmapLayer;
  obs;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );

  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
    this.opened = true;
    this.airPollutionLevel = false;
    this.airPollutionLevelRidotti = false;
    this.airPollutionSettings = false;
  }

  ngOnInit() {
    this.initializeMap();
    this.setAirPollutionHeatmap();
    //this.setAirPollutionHeatmapRidotti();
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
        center: lecce,
        zoom: 6,
        minZoom: minZoom,
        maxZoom: maxZoom
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

  setAirPollutionHeatmapRidotti(): Observable<boolean> {
    return new Observable( observer => {
      if (this.airPollutionVectorRidotti == undefined) {
        this.mongoRestService.getGeoJSONRidotti().subscribe(geoJSON => {
          this.airPollutionVectorRidotti = new HeatmapLayer({
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
          this.airPollutionVectorRidotti.getSource().on('addfeature', function (event) {
            // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
            // standards-violating <magnitude> tag in each Placemark.  We extract it from
            // the Placemark's name instead.
            var name = event.feature.get('leq');
            var magnitude = parseFloat(name);
            event.feature.set('weight', magnitude);
          });
          console.log("Finito heatmap");
          observer.next(true);
          observer.complete();
        });
      } else {
        observer.next(true);
        observer.complete();
      }
    })
  }

/*  setAirPollutionHeatmapRidotti(): Promise<boolean> {
    this.mongoRestService.getGeoJSONRidotti().subscribe( geoJSON => {
      this.airPollutionVectorRidotti = new HeatmapLayer({
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
      this.airPollutionVectorRidotti.getSource().on('addfeature', function(event) {
        // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
        // standards-violating <magnitude> tag in each Placemark.  We extract it from
        // the Placemark's name instead.
        var name = event.feature.get('leq');
        var magnitude = parseFloat(name);
        event.feature.set('weight', magnitude);
      });
      console.log("Finito heatmap");
      return true;
    });
    return false;
  }*/

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
    var zoom = this.map.getView().getZoom();
    var glbox = this.map.getView().calculateExtent(this.map.getSize());
    var  box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
    console.log(box);
    console.log(zoom);
    this.airPollutionSettings = !this.airPollutionSettings;
  }

  setRadiusSize(event) {
    this.airPollutionVector.setRadius(event.value);
  }

  setBlurSize(event) {
    this.airPollutionVector.setBlur(event.value);
  }

  setOpacity(event) {
    this.airPollutionVector.setOpacity(event.value);
  }

  changeDate() {
    if (this.airPollutionLevel) {
      this.setAirPollutionHeatmap();
    }
  }

  addAirPollutionLayerRidotti() {
    if (this.airPollutionLevelRidotti == false) {
      this.setAirPollutionHeatmapRidotti().subscribe( res => {
        this.map.addLayer(this.airPollutionVectorRidotti);
      });
    } else {
      this.map.removeLayer(this.airPollutionVectorRidotti);
    }
  }
}
