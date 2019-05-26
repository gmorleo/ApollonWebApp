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
import {catchError, map} from 'rxjs/operators';
import { fromLonLat, transform , transformExtent} from 'ol/proj';
import {toObservable} from '@angular/forms/src/validators';
import {Box} from '../models/box';
import {MatSliderChange} from '@angular/material';

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

const lecce = fromLonLat([18.174631, 40.354130]);

const gal = fromLonLat([13.174631, 40.354130]);
const default_zoom = 15;
const minZoom = 4;
const maxZoom = 17;
const maxPollution =1.5;


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
  vectorMap = {};
  storedTile = {};

  airPollutionVector: HeatmapLayer;
  leqVectorLevel: HeatmapLayer;

  leqVectorSource: VectorSource = [];

  zoom = 0;
  center: any;
  box: any;

/*  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches)
    );*/


  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
  }

  ngOnInit() {

    this.center = transform(lecce,'EPSG:3857','EPSG:4326');
    this.zoom = default_zoom;
    this.days = last7Days();
    this.selectedDay = this.days.length-1;
    this.date = stringToDate(this.days[this.selectedDay]);
    this.initializeMap();
    this.initializeLeqLevel();
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

/*    this.map.on('moveend', (evt) => {
      if (this.leqLevel) {
        this.update(evt);
        if(zoom != this.zoom) {
          this.leqVectorLevel.setSource(this.vectorMap[vectorKey]);
        }
      }
    });*/

    this.map.on('moveend', (evt) => {
      var map = evt.map;
      var zoom = Math.trunc(this.map.getView().getZoom());
      var vectorKey = zoom+"/"+formatDate(this.date, 1);
      if (this.leqLevel) {
        this.setSource(vectorKey);
        if(zoom != this.zoom) {
          this.leqVectorLevel.setSource(this.vectorMap[vectorKey]);
        }
      }
    });
  }

/*
  update(evt) {
    var map = evt.map;
    var zoom = Math.trunc(map.getView().getZoom());
    var vectorKey = zoom+"/"+formatDate(this.date, 1);
    this.setSource(vectorKey);
    if(zoom != this.zoom) {
      this.leqVectorLevel.setSource(this.vectorMap[vectorKey]);
    }
  }
*/

  updateLeq() {
    var zoom = Math.trunc(this.map.getView().getZoom());
    var vectorKey = zoom+"/"+formatDate(this.date, 1);
    this.setSource(vectorKey);
    this.leqVectorLevel.setSource(this.vectorMap[vectorKey]);
  }

  initializeLeqLevel() {
    this.leqVectorLevel = new HeatmapLayer({
      blur: 15,
      radius: 20,
      opacity: 0.3,
      renderMode: 'image',
      weight: (feature) => {
        var weightProperty = feature.get('leq');
        weightProperty = weightProperty / maxPollution; // perform some calculation to get weightProperty between 0 - 1
        return weightProperty;
      }
    });
  }

  showLeqLevel() {
    if (this.leqLevel == false) {
      this.map.addLayer(this.leqVectorLevel);
      this.updateLeq();
    } else {
      this.map.removeLayer(this.leqVectorLevel);
    }
  }

  setSource(vectorKey) {
      var glbox = this.map.getView().calculateExtent(this.map.getSize());
      var box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
      var dim_tile = Math.ceil((box[2]-box[0])/4);
      var start_tile = [box[0]-(box[0]%dim_tile), box[1]-(box[1]%dim_tile)];
      if (!(vectorKey in this.vectorMap)) {
        this.vectorMap[vectorKey]= new VectorSource();
        this.leqVectorLevel.setSource(this.vectorMap[vectorKey]);
      }
      console.log("Tiles caricate: ");
      var tile = [start_tile[0], start_tile[1]];
      while (tile[1] <= box[3]+dim_tile){
        while (tile[0] <= box[2]+dim_tile){
          var tileKey =tile[0]+"/"+tile[1]+"/"+(tile[0]+dim_tile)+"/"+(tile[1]+dim_tile)+"/"+vectorKey;
          if (!(tileKey in this.storedTile)) {
            console.log(tileKey);
            this.storedTile[tileKey] = "1";
            this.mongoRestService.getTile(tileKey).subscribe(geoJSON => {
              this.vectorMap[vectorKey].addFeatures(geojsonFormat.readFeatures(geoJSON));
            });
          }
          tile = [tile[0] + dim_tile, tile[1]];
        }
        tile = [start_tile[0], tile[1] + dim_tile];
      }
  }

  showAirPollutionSettings() {
    this.airPollutionSettings = !this.airPollutionSettings;
  }

  setProperty (zoom) {
    switch(zoom) {
      case 16:{
        this.leqVectorLevel.setRadius(30);
        this.leqVectorLevel.setBlur(28);
        break;
      }
      case 14:{
        this.leqVectorLevel.setRadius(25);
        this.leqVectorLevel.setBlur(25);
        break;
      }
      case 12:{
        this.leqVectorLevel.setRadius(38);
        this.leqVectorLevel.setBlur(20);
        break;
      }
      case 10:{
        this.leqVectorLevel.setRadius(14);
        this.leqVectorLevel.setBlur(20);
        break;
      }
      case 8:{
        console.log("case");
        this.leqVectorLevel.setRadius(7);
        this.leqVectorLevel.setBlur(15);
        break;
      }
      case 6:{
        console.log("case");
        this.leqVectorLevel.setRadius(10);
        this.leqVectorLevel.setBlur(10);
        break;
      }
      case 4:{
        this.leqVectorLevel.setRadius(15);
        this.leqVectorLevel.setBlur(7);
        break;
      }

      default:
        this.leqVectorLevel.setRadius(4);
        this.leqVectorLevel.setBlur(12);
    }

/*    3 10 10

    5 5 10

    7 5 20

    9 5 10

    11 10 20*/
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

  changeDate() {
    this.date = stringToDate(this.days[this.selectedDay]);
    if (this.leqLevel) {
      this.updateLeq();
    }
  }
}

function formatDate(date, mode){
  var dd = date.getDate();
  var mm = date.getMonth()+1;
  var yyyy = date.getFullYear();
  if(dd<10) {dd='0'+dd}
  if(mm<10) {mm='0'+mm}
  switch (mode) {
    case 1:
      date = yyyy+'/'+mm+'/'+dd;
      break;
    case 2:
      date = dd+'/'+mm
      break;
  }
  return date
}

function last7Days () {
  var result = [];
  var i = 7;
  while (i!=0) {
    i--;
    var d = new Date();
    d.setDate(d.getDate() - i);
    result.push( formatDate(d,2) )
  }
  return result;
  //return(result.join(','));
}

function stringToDate(str) {
  var split = str.split("/");
  var date = new Date("2019-"+split[1]+"-"+split[0]);
  return date;
}
