import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GeoJSON} from 'ol/format';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ';
import {MongoRestService} from '../services/mongo-rest.service';
import {BreakpointObserver} from '@angular/cdk/layout';
import { fromLonLat, transformExtent} from 'ol/proj';


const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

const lecce = fromLonLat([18.174631, 40.354130]);

const gal = fromLonLat([13.174631, 40.354130]);
const default_zoom = 9;
const minZoom = 3;
const maxZoom = 16;
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

  splLevel: boolean = false;
  leqLevel: boolean = false;
  airPollutionSettings: boolean = false;

  days = [];
  selectedDay;
  date: Date;

  map: Map;
  leqVectorMap = {};
  storedTile = {};

  leqHeatmapLevel: HeatmapLayer;
  zoom = 0;

  constructor(private breakpointObserver: BreakpointObserver, public mongoRestService: MongoRestService) {
  }

  ngOnInit() {
    this.initializeTimeTravel();
    this.initializeMap();
    this.initializeLeqLevel();
    this.addMapListener();
  }
  
  //Inizializzo il time travel
  initializeTimeTravel() {
    this.days = last7Days();
    this.selectedDay = this.days.length-1;
    this.date = stringToDate(this.days[this.selectedDay]);
  }

  //Inizializzo il livello Heatmap vuoto
  initializeLeqLevel() {
    this.leqHeatmapLevel = new HeatmapLayer({
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

  //Inizializzo la mappa
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
    this.zoom = default_zoom;
  }

  //Aggiungo il listener sulla mappa
  addMapListener() {
    this.map.on('moveend', (evt) => {
      var map = evt.map;
      var zoom = Math.trunc(this.map.getView().getZoom());
      console.log("zoom: ",zoom);
      if (this.leqLevel) {
        var vectorKey = this.updateLeq();
        if(zoom != this.zoom) {
          console.log("cambio sorgente",zoom);
          this.leqHeatmapLevel.setSource(this.leqVectorMap[vectorKey]);
        }
      }
    });
  }

  updateLeq() {
    var zoom = Math.trunc(this.map.getView().getZoom());
    if (zoom%2 == 1) {
      zoom += 1;
    }
    var vectorKey = zoom+"/"+formatDate(this.date, 1);
    this.setSource(vectorKey);
    return vectorKey;
  }

  //Imposto la sorgente vettoriale alla Heatmap
  setSource(vectorKey) {
      var glbox = this.map.getView().calculateExtent(this.map.getSize());
      var box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
      var dim_tile = Math.ceil((box[2]-box[0])/4);
      var start_tile = [box[0]-(box[0]%dim_tile), box[1]-(box[1]%dim_tile)];

      //Creo un livello vettoriale per ogni ogni livello di zoom, se non esiste ne creo uno, così da non dover ricaricare le tiles già caricate
      if (!(vectorKey in this.leqVectorMap)) {
        this.leqVectorMap[vectorKey]= new VectorSource();
        this.leqHeatmapLevel.setSource(this.leqVectorMap[vectorKey]);
      }

      console.log("Tiles caricate: ");
      var tile = [start_tile[0], start_tile[1]];
      while (tile[1] <= box[3]+dim_tile){
        while (tile[0] <= box[2]+dim_tile){
          //Inizio a scorrere le tile salvando quelle che ho già scaricato, così che prima di scaricarne una controllo se è già stata scaricata
          var tileKey =tile[0]+"/"+tile[1]+"/"+(tile[0]+dim_tile)+"/"+(tile[1]+dim_tile)+"/"+vectorKey;
          if (!(tileKey in this.storedTile)) {
            console.log(tileKey);
            this.storedTile[tileKey] = "1";
            //Se la tile non è presente allora la scarico e ne aggiungo i punti alla sorgente vettoriale corrispondente
            this.mongoRestService.getTile(tileKey).subscribe(geoJSON => {
              this.leqVectorMap[vectorKey].addFeatures(geojsonFormat.readFeatures(geoJSON));
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

  showLeqLevel() {
    if (this.leqLevel == false) {
      this.map.addLayer(this.leqHeatmapLevel);
      var vectorKey = this.updateLeq();
      this.leqHeatmapLevel.setSource(this.leqVectorMap[vectorKey]);
    } else {
      this.map.removeLayer(this.leqHeatmapLevel);
    }
  }

  setRadiusSize(event) {
    this.leqHeatmapLevel.setRadius(event.value);
  }

  setBlurSize(event) {
    this.leqHeatmapLevel.setBlur(event.value);
  }

  setOpacity(event) {
    this.leqHeatmapLevel.setOpacity(event.value);
  }

  changeDate() {
    this.date = stringToDate(this.days[this.selectedDay]);
    if (this.leqLevel) {
      var vectorKey = this.updateLeq();
      this.leqHeatmapLevel.setSource(this.leqVectorMap[vectorKey]);
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
