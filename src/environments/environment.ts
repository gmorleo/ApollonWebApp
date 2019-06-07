// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false
};

export function formatDate(date, mode){
  var dd = date.getDate();
  var mm = date.getMonth()+1;
  var yyyy = date.getFullYear();
  if(dd<10) {dd='0'+dd}
  if(mm<10) {mm='0'+mm}
  switch (mode) {
    case 1:
      date = yyyy+'/'+mm+'/'+dd;
      break;
    case 2:
      date = dd+'/'+mm
      break;
  }
  return date
}

export function last7Days () {
  var result = [];
  var i = 7;
  while (i!=0) {
    i--;
    var d = new Date();
    d.setDate(d.getDate() - i);
    result.push(formatDate(d,2) )
  }
  return result;
  //return(result.join(','));
}

export function stringToDate(str) {
  var split = str.split("/");
  var date = new Date("2019-"+split[1]+"-"+split[0]);
  return date;
}

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
