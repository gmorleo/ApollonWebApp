import { TestBed } from '@angular/core/testing';

import { MongoRestService } from './mongo-rest.service';

describe('MongoRestService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MongoRestService = TestBed.get(MongoRestService);
    expect(service).toBeTruthy();
  });
});
