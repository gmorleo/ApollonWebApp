import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapmapComponent } from './mapmap.component';

describe('MapmapComponent', () => {
  let component: MapmapComponent;
  let fixture: ComponentFixture<MapmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
