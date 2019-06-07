import {Component, OnInit, ViewChild} from '@angular/core';
import {MapComponent} from '../map/map.component';
import {MatCheckboxChange} from '@angular/material';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  events: string[] = [];
  opened: boolean = true;

  splLevel: boolean = false;
  leqLevel: boolean = false;
  airPollutionSettings: boolean = false;

  @ViewChild(MapComponent)
  private mapComponent: MapComponent;


  constructor() { }

  ngOnInit() {
  }

  addLeqLevel() {
    if (this.leqLevel) {
      this.mapComponent.addLeqLevel();
    } else {
      this.mapComponent.removeLeqLevel();
    }
  }
}
