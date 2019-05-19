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

  getGeoJSONRidotti(zoom, min_lon, min_lat, max_lon, max_lat):Observable<GeoJSON> {
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getMongo/"+zoom+"/"+min_lon+"/"+min_lat+"/"+max_lon+"/"+max_lat);
    console.log(request);
    return request;
  }


   getDate():Observable<String[]> {
    let request = this.http.get<String[]>( "http://localhost:8090/test/getDate");
    return request;
   }
}
