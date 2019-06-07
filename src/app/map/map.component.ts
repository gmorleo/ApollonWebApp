import {Component, Input, OnInit, SimpleChange} from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {GeoJSON} from 'ol/format';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ';
import {MongoRestService} from '../services/mongo-rest.service';
import { fromLonLat, transformExtent} from 'ol/proj';
import {formatDate, last7Days, stringToDate} from '../../environments/environment';

const   geojsonFormat = new GeoJSON({
  extractStyles: false,
  featureProjection: 'EPSG:3857'
});

const lecce = fromLonLat([18.174631, 40.354130]);
const default_zoom = 9;
const minZoom = 3;
const maxZoom = 16;
const maxPollution =1.5;
const level = [4,4,6,6,8,8,10,10,12,12,14,14,16,16];
const tiles_size = [15,15,5,5,2,2,1.5,1.5,1,1,0.5,0.5,0.3,0.3];

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  events: string[] = [];
  opened: boolean = true;
  showSpinner: boolean = false;

  @Input('leqLevel')
  leqLevel: boolean;
  @Input('splLevel')
  splLevel: boolean;

  days = [];
  selectedDay;
  date: Date;

  map: Map;
  leqVectorMap = {};
  storedTile = {};

  currentLeqSource: string = "";

  leqHeatmapLevel: HeatmapLayer;
  zoom = 0;

  constructor(public mongoRestService: MongoRestService) {
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
      //Se il livello è abilitato allora posso aggiornarlo
      if (this.leqLevel) {
        var leqSource = this.updateLeqSource();
        //Se il vettore sorgente visualizzato è diverso da quello che mi serve allora lo aggiorno
        if(leqSource != this.currentLeqSource) {
          console.log("cambio livello");
          this.leqHeatmapLevel.setSource(this.leqVectorMap[leqSource]);
          this.currentLeqSource = leqSource;
        }
      }
    });
  }

  addLeqLevel() {
    this.map.addLayer(this.leqHeatmapLevel);
    var leqSource = this.updateLeqSource();
    this.leqHeatmapLevel.setSource(this.leqVectorMap[leqSource]);
  }

  removeLeqLevel() {
    this.map.removeLayer(this.leqHeatmapLevel);
    this.currentLeqSource = "";
  }

  updateLeqSource(): string {
    //Crea il nome del vettore sorgente nel seguente modo: N_Livello/Data
    var zoom = Math.trunc(this.map.getView().getZoom());
    var vectorKey = level[zoom-3]+"/"+formatDate(this.date, 1);

    //Calcola le dimensioni del box, la dimensione della tile, e da quali coordinate iniziare lo scorrimento
    var glbox = this.map.getView().calculateExtent(this.map.getSize());
    var box = transformExtent(glbox,'EPSG:3857','EPSG:4326');
    var dim_tile = tiles_size[zoom-3];
    var start_tile = [box[0]-(box[0]%dim_tile), box[1]-(box[1]%dim_tile)];

    //Se il vettore sorgente non è presente allora lo crea
    if (!(vectorKey in this.leqVectorMap)) {
      this.leqVectorMap[vectorKey]= new VectorSource();
    }

    //Scorre la griglia
    console.log("Tiles caricate: ");
    for (var i=start_tile[1]; i <= box[3]+dim_tile; i = Math.trunc((i += dim_tile)*10)/10){
      for (var j=start_tile[0]; j <= box[2]+dim_tile; j = Math.trunc((j + dim_tile)*10)/10){
        //Per ogni tile assegno un nome, e la salvo in memoria, così che se ho già richiesto quella tile non viene ricaricata
        var tileKey =j+"/"+i+"/"+(j+dim_tile)+"/"+(i+dim_tile)+"/"+vectorKey;
        if (!(tileKey in this.storedTile)) {
          console.log(tileKey);
          this.storedTile[tileKey] = "1";
          //Se la tile non è presente allora la scarico e ne aggiungo i punti alla sorgente vettoriale corrispondente
          this.mongoRestService.getTile(tileKey).subscribe(geoJSON => {
            this.leqVectorMap[vectorKey].addFeatures(geojsonFormat.readFeatures(geoJSON));
          });
        }
      }
    }
    return vectorKey;
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

  //Cambio la data di visualizzazione
  changeDate() {
    this.date = stringToDate(this.days[this.selectedDay]);
    if (this.leqLevel) {
      var leqSource = this.updateLeqSource();
      this.leqHeatmapLevel.setSource(this.leqVectorMap[leqSource]);
    }
  }

}
