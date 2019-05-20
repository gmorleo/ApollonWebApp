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
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getGeo");
    return request;
  }

  getGeoJSONRidotti(zoom, lon_min,lat_min,lon_max,lat_max):Observable<GeoJSON> {
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getJongo/"+zoom+"/"+lon_min+"/"+lat_min+"/"+lon_max+"/"+lat_max);
    console.log(request);
    return request;
  }


   getDate():Observable<String[]> {
    let request = this.http.get<String[]>( "http://localhost:8090/test/getDate");
    return request;
   }
}
