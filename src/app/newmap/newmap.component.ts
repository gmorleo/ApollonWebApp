import {AfterViewInit, Component, OnInit} from '@angular/core';

import MousePosition from 'ol/control';
import createStringXY from 'ol/coordinate'
import OSM from 'ol/source'
import Tile from 'ol/layer'
import defaults from 'ol/control'
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, transform } from 'ol/proj';

@Component({
  selector: 'app-newmap',
  templateUrl: './newmap.component.html',
  styleUrls: ['./newmap.component.css']
})
export class NewmapComponent implements OnInit {


  map: Map;
  source: XYZ;
  layer: TileLayer;
  view: View;

  latitude = 40.339651;
  longitude = 18.115893;
  zoom = 10;

  constructor() { }

  ngOnInit() {
      this.source = new XYZ({
        url: 'http://tile.osm.org/{z}/{x}/{y}.png'
      });

      this.layer = new TileLayer({
        source: this.source
      });

      this.view = new View({
        center: fromLonLat([this.longitude, this.latitude]),
        zoom: this.zoom
      });

      this.map = new Map({
        target: 'map',
        layers: [this.layer],
        view: this.view
      });
  }

  setCenter() {
    console.log("ciao")
    var view = this.map.getView();
    view.setCenter(fromLonLat([this.longitude, this.latitude]));
    view.setZoom(8);
  }
}
