import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GeoJSON} from 'ol/format';

@Injectable({
  providedIn: 'root'
})
export class MongoRestService {

  constructor(public  http: HttpClient) { }

  getGeoJSON():Observable<GeoJSON> {
    console.log(this.http.get("http://localhost:8090/test/getGeo"));
    let request = this.http.get<GeoJSON>("http://localhost:8090/test/getGeo");
    return request;
  }
}
