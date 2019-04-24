import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewmapComponent } from './newmap.component';

describe('NewmapComponent', () => {
  let component: NewmapComponent;
  let fixture: ComponentFixture<NewmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
