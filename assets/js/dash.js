var bikesQueryUrl = "https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";
// Promise.allSettle([])
var promises=d3.json(bikesQueryUrl)
// var promise1=Promise.resolve(3);
buildMap();
L.control.layers(baseMaps, overlayMaps, {
collapsed: true
}).addTo(myMap);


Promise.allSettled([promises]).then(result=>console.log(result));
  // then((results) => results.forEach((result) => console.log(result.status)));

function buildMap(){
	// Define streetmap and darkmap layers
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

	// Define a baseMaps object to hold base layers
	var baseMaps = {
	"Street Map": streetmap,
	"Dark Map": darkmap
	};

	// Create overlay object to hold overlay layer
	// var overlayMaps = {
	// 	bikes: bikeLayer, 
	// 	'stations path': stationLayer, 
	// 	stations: stnEntLayer,
	// 	hospitals: hospitalLayer, 
	// 	'primary care facilities': primaryLayer,
	// 	'voting centers': vcenterLayer
	// };

	// Create our map, giving it the streetmap and earthquakes layers to display on load
	var myMap = L.map("map", {
	center: [38.906, -77.03],
	zoom: 13,
	// layers: [streetmap, bikeLayer]
	layers: [streetmap]
	});

	// L.control.layers(baseMaps, overlayMaps, {
	// collapsed: true
	// }).addTo(myMap);
}
