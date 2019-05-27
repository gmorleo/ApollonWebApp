import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GeoJSON} from 'ol/format';

@Injectable({
  providedIn: 'root'
})
export class MongoRestService {

  constructor(public  http: HttpClient) { }


  getTile(tileKey) {
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getData/"+tileKey);
    return request;
  }
}
