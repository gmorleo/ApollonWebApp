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
    let request = this.http.get<GeoJSON>("http://localhost:8090/test/getGeo");
    return request;
  }

  getDayLevel(zoom, date: Date):Observable<GeoJSON> {
    console.log(date.getUTCMonth());
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getDayLevel/"+Math.trunc(zoom)+"/"+date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate());
    return request;
  }

  getGeoJSONRidotti(zoom, lon_min,lat_min,lon_max,lat_max, date: Date):Observable<GeoJSON> {
    var m = date.getMonth() + 1;
    if (m < 10) {
      var month = "0"+ m;
    }
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getJongo/"+lon_min+"/"+lat_min+"/"+lon_max+"/"+lat_max+"/"+Math.trunc(zoom)+"/"+date.getFullYear()+"/"+month+"/"+date.getDate());
    return request;
  }

  getTile(tileKey) {
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/getJongo/"+tileKey);
    return request;
  }

/*  getGeoJSONRidotti(zoom, lon_min,lat_min,lon_max,lat_max, date: Date):Observable<GeoJSON> {
    let request = this.http.get<GeoJSON>("http://localhost:8080/test/get");
    return request;
  }*/


   getDate():Observable<String[]> {
    let request = this.http.get<String[]>( "http://localhost:8090/test/getDate");
    return request;
   }
}
