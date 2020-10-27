var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';
var bikesQueryUrl = "https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";

function buildTemp(temps){
	var temp_panel=d3.select('#temp-data');
	temp_panel.html("<p><b>Current Weather: </b></p>");
	Object.entries(temps[0]['attributes']).forEach(([key, value])=>{
		temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`);
	});
};
d3.json(tempQueryUrl).then(function(temp_data){
	buildTemp(temp_data['features']);
});

// Promise.allSettle([])	
var promises=d3.json(bikesQueryUrl)
// var promise1=Promise.resolve(3);
myMap=buildMap();
// buildMap();
// L.marker([38.91, -77.04], {icon: greenIcon}).addTo(myMap);
L.marker([38.91, -77.04]).addTo(myMap);

// Promise.allSettled([promises]).then(result=>console.log(result));
  // then((results) => results.forEach((result) => console.log(result.status)));

function buildMap(){
	// base layers - streetmap and darkmap
	var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
	attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
	tileSize: 512,
	maxZoom: 18,
	zoomOffset: -1,
	id: "mapbox/streets-v11",
	accessToken: API_KEY
	});

	var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
	attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
	maxZoom: 18,
	id: "dark-v10",
	accessToken: API_KEY
	});

	var baseMaps = {
	"Street Map": streetmap,
	"Dark Map": darkmap
	};

	d3.json(bikesQueryUrl).then(function(bikes_data) {
		var bikeMarkers = [];
		var bikes=bikes_data['data']['bikes']
		var scooterIcon = L.icon({
			iconUrl: 'assets/images/kick-scooter.png',
			iconSize:     [20, 20], // size of the icon
		});
		for (var i = 0; i < bikes.length; i++) {
		  	bikeMarkers.push(
		    	L.marker([bikes[i]['lat'], bikes[i]['lon']], {icon: scooterIcon}).bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>")
		  	);
		};
		var bikeLayer = L.layerGroup(bikeMarkers);
		var overlayMaps = {
			bikes: bikeLayer
		}
		L.control.layers(baseMaps, overlayMaps, {
		collapsed: true
		}).addTo(myMap);
	});
	
	// Create overlay object to hold overlay layer
	// var overlayMaps = {
	// 	bikes: bikeLayer
	// 	// bikes: bikeLayer, 
	// // 	'stations path': stationLayer, 
	// // 	stations: stnEntLayer,
	// // 	hospitals: hospitalLayer, 
	// // 	'primary care facilities': primaryLayer,
	// // 	'voting centers': vcenterLayer
	// };

	var myMap = L.map("map", {
	center: [38.906, -77.03],
	zoom: 13,
	// layers: [streetmap, bikeLayer]
	layers: [streetmap]
	});

	return myMap;
}
