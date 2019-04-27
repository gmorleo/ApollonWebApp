import {AfterViewInit, Component, OnChanges, OnInit} from '@angular/core';

import MousePosition from 'ol/control';
import createStringXY from 'ol/coordinate'
import OSM from 'ol/source'
import Tile from 'ol/layer'
import defaults from 'ol/control'
import Overlay from 'ol/Overlay.js'
import Map from 'ol/Map';
import View from 'ol/View';
import {toStringHDMS} from 'ol/coordinate.js';
import TileLayer from 'ol/layer/Tile.js';
import {toLonLat} from 'ol/proj.js';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, transform } from 'ol/proj';
import {Observable} from 'rxjs';
import {computeStyle} from '@angular/animations/browser/src/util';

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

  constructor() {

  }

  ngOnInit() {

    /**
     * Elements that make up the popup.
     */
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');


    /**
     * Create an overlay to anchor the popup to the map.
     */
    var overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });

/*    /!**
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     *!/
    closer.onclick = function() {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };*/


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

    var pos = fromLonLat([16.3725, 48.208889]);
    // Vienna marker
    var viennaInfo = new Overlay({
      position: pos,
      positioning: 'top-left',
      element: document.getElementById('viennaInfo'),
      stopEvent: false
    });
    this.map.addOverlay(viennaInfo);
    this.map.addOverlay(overlay);


    /**
     * Add a click handler to the map to render the popup.
     */
    this.map.on('singleclick', function(evt) {
      var coordinate = evt.coordinate;
      var hdms = toStringHDMS(toLonLat(coordinate));

      content.innerHTML = '<p>You clicked here:</p><code>' + hdms +
        '</code>';
      overlay.setPosition(coordinate);
    });

  }

  getZoom() {

  }

  setCenter() {
    console.log("ciao")
    var view = this.map.getView();
    view.setCenter(fromLonLat([this.longitude, this.latitude]));
    view.setZoom(8);
  }

}
