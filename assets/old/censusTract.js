censusQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Demographic_WebMercator/MapServer/36/query?where=1%3D1&outFields=TRACTID,POP10,HOUSING10&outSR=4326&f=json';
async function mapCensusTract(){
	var response=await fetch(censusQueryUrl);
	var census=await response.json();
	// Create an initial map object
	// Set the longitude, latitude, and the starting zoom level
	var myMap = L.map("map").setView([38.906, -77.03], 13);
	// Add a tile layer (the background map image) to our map
	// Use the addTo method to add objects to our map
	L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
	  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
	  tileSize: 512,
	  maxZoom: 18,
	  zoomOffset: -1,
	  id: "mapbox/streets-v11",
	  accessToken: API_KEY
	}).addTo(myMap);
	// Create a Polygon and pass in some initial options
	censusTractPolys=[];
	census['features'].forEach(feature=>{
		L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "yellow",
			fillOpacity: 0.25, 
			weight: .25
		}).addTo(myMap);
	});
	// console.log(inside([38.9, -77.04], L.GeoJSON.coordsToLatLngs(census['features'][0]['geometry']['rings'][0])));
	// var testAry=census['features'].filter(feature=>inside([-77.036873, 38.907192], feature['geometry']['rings'][0])==true);
	var testAry=census['features'].filter(feature=>inside([38.9072, -77.0369], L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]))==true);
	// console.log(L.GeoJSON.coordsToLatLngs(census['features'][0]['geometry']['rings'][0]));
	testAry.forEach(feature=>{
		L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "red",
			fillOpacity: 0.25
		}).addTo(myMap);
	});
	console.log(testAry);
};

function inside(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    var x = point[0]; //lat
    var y = point[1]; //long
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i]['lat']; //use [0] if array and ['lat'] if JSON
        var yi = vs[i]['lng']; //use [1] if array and ['lng'] if JSON
        var xj = vs[j]['lat']; //use [0] if array and ['lat'] if JSON
        var yj = vs[j]['lng']; //use [1] if array and ['lng'] if JSON
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }  
    return inside;
};

mapCensusTract().then(response=>console.log('Census Refreshed')).catch(error=>console.log(error));

