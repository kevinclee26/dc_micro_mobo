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
	censusTractPolys=[]
	// 
	var sampleCoords=census['features'][0]['geometry']['rings']
	var sample=census['features'][0]
	var correctCoords=sampleCoords.map(coord=>
		'test'
	);
	// console.log(sampleCoords);
	// console.log(correctCoords);
	census['features'].forEach(feature=>{
		L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "yellow",
			fillOpacity: 0.75
		}).addTo(myMap);
	})
	// console.log(L.GeoJSON.coordsToLatLngs(sample['geometry']['rings'][0]));

	// console.log(L.geoJSON(census, {
	//     coordsToLatLng: function (coords) {
	//         //                    latitude , longitude, altitude
	//         //return new L.LatLng(coords[1], coords[0], coords[2]); //Normal behavior
	//         return new L.LatLng(coords[0], coords[1], coords[2]);
 //    	}
	// }));
}

mapCensusTract().then(response=>console.log('Census Refreshed')).catch(error=>console.log(error));