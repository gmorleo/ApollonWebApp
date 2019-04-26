import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map.js';
import Overlay from 'ol/Overlay.js';
import View from 'ol/View.js';
import {toStringHDMS} from 'ol/coordinate.js';
import TileLayer from 'ol/layer/Tile.js';
import {fromLonLat, toLonLat} from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';

@Component({
  selector: 'app-mapmap',
  templateUrl: './mapmap.component.html',
  styleUrls: ['./mapmap.component.css']
})
export class MapmapComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    var layer = new TileLayer({
      source: new OSM()
    });

    var map = new Map({
      layers: [layer],
      target: 'map',
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });

    var pos = fromLonLat([16.3725, 48.208889]);

    // Vienna marker
    var marker = new Overlay({
      position: [0, 0],
      positioning: 'center-center',
      element: document.getElementById('marker'),
      stopEvent: false
    });
    map.addOverlay(marker);
  }

}
