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
import {MatSliderChange} from '@angular/material';

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
  leqLevel: boolean = false;
  airPollutionSettings: boolean = false;

  days = [];
  selectedDay;
  date: Date;

  map: Map;

  airPollutionVector: HeatmapLayer;
  leqVectorLevel: HeatmapLayer;

  zoom = 0;
  box: any;

/*  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );*/


  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
  }

  ngOnInit() {
    this.initializeMap();
    this.days = last7Days();
    this.selectedDay = 6;
    this.date = stringToDate(this.days[this.selectedDay]);
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

    this.map.on('moveend', (evt) => {
      var map = evt.map;
      var zoom = this.map.getView().getZoom();
      var box = this.getViewSize();
      if (this.leqLevel) {
        this.addLeqLevel(this.date);
      }
    });
  }

  showLeqLevel() {
    if (this.leqLevel == false) {
      this.addLeqLevel(this.date);
    } else {
      this.map.removeLayer(this.leqVectorLevel);
      this.zoom = 0;
    }
  }

  addLeqLevel(date) {
    var zoom = this.map.getView().getZoom();
    var box = this.getViewSize();
    if ((zoom!=this.zoom ||
        ((this.box[0]-1)-box[0] > 0) ||
        ((this.box[1]-1)-box[1] > 0) ||
        ((this.box[2]+1)-box[2] < 0) ||
        ((this.box[3]+1)-box[3] < 0)) &&
        (zoom < 14)) {
      this.showSpinner = true;
      this.map.removeLayer(this.leqVectorLevel);
      this.setLeqVectorLevel(zoom,box,date).subscribe( res => {
        this.setProperty();
        this.map.addLayer(this.leqVectorLevel);
        this.showSpinner = false;
      }, error1 => {console.log("errore")});
      this.zoom = zoom;
      this.box = box;
    }
  }

  setLeqVectorLevel(zoom,box,date) {
    return new Observable( observer => {
      this.mongoRestService.getGeoJSONRidotti(zoom,box[0]-1,box[1]-1,box[2]+1,box[3]+1,date).subscribe(geoJSON => {
        this.leqVectorLevel = new HeatmapLayer({
          source: new VectorSource({
            features: geojsonFormat.readFeatures(geoJSON),
          }),
          blur: 19,
          radius: 19,
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
        blur: 19,
        radius: 19,
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

/*  setTravelTimeDate() {
    this.mongoRestService.getDate().subscribe( res => {
      this.date = res;
    })
  }*/

  showAirPollutionSettings() {
    this.airPollutionSettings = !this.airPollutionSettings;
  }

  setProperty(){
    if (this.map.getView().getZoom() > 10) {
      if (this.map.getView().getZoom() >= 12) {
        this.leqVectorLevel.setRadius(42);
        this.leqVectorLevel.setBlur(38);
      } else {
        this.leqVectorLevel.setRadius(38);
        this.leqVectorLevel.setBlur(38);
      }

    } else {
      this.leqVectorLevel.setRadius(19);
      this.leqVectorLevel.setBlur(19);
    }
  }

  setRadiusSize(event) {
    this.leqVectorLevel.setRadius(event.value);
  }

  setBlurSize(event) {
    this.leqVectorLevel.setBlur(event.value);
  }

  setOpacity(event) {
    this.leqVectorLevel.setOpacity(event.value);
  }




  getViewSize():any {
    var glbox = this.map.getView().calculateExtent(this.map.getSize());
    var box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
    return box;
  }

  changeDate() {
    this.date = stringToDate(this.days[this.selectedDay]);
  }
}

function formatDate(date){
  var dd = date.getDate();
  var mm = date.getMonth()+1;
  //var yyyy = date.getFullYear();
  if(dd<10) {dd='0'+dd}
  if(mm<10) {mm='0'+mm}
  //date = dd+'/'+mm+'/'+yyyy;
  date = dd+'/'+mm
  return date
}

function last7Days () {
  var result = [];
  var i = 7;
  while (i!=0) {
    i--;
    var d = new Date();
    d.setDate(d.getDate() - i);
    result.push( formatDate(d) )
  }
/*  for (var i=6; i>0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    result.push( formatDate(d) )
  }*/
  return result;
  //return(result.join(','));
}

function stringToDate(str) {
  var split = str.split("/");
  var date = new Date("2019-"+split[1]+"-"+split[0]);
  return date;
}
