// Store our API endpoint inside queryUrl
var bikesQueryUrl = "https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";
var stationsQueryUrl = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/106/query?where=1%3D1&outFields=*&outSR=4326&f=json'
var stationsGeoQueryUrl='https://opendata.arcgis.com/datasets/a29b9dbb2f00459db2b0c3c56faca297_106.geojson';
var hospitalQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Health_WebMercator/MapServer/4/query?where=1%3D1&outFields=NAME,ADDRESS&outSR=4326&f=json';
var primaryQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Health_WebMercator/MapServer/7/query?where=1%3D1&outFields=PrimaryCarePt.Shape,PrimaryCarePt.NAME,PrimaryCarePt.ADDRESS&outSR=4326&f=json';
var votingQueryUrl='https://services.arcgis.com/neT9SoYxizqTHZPH/arcgis/rest/services/General_2020_Election_Vote_Centers_View/FeatureServer/0/query?where=1%3D1&outFields=LOCATION,StAddr,USER_VOTING_SPACE,STATUS,HOURS&outSR=4326&f=json';
var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';

// Perform a GET request to the query URL
d3.json(bikesQueryUrl).then(function(bikes_data) {
	// Once we get a response, send the data.features object to the createFeatures function
	d3.json(stationsGeoQueryUrl).then(function(stations_data){
		d3.json(hospitalQueryUrl).then(function(hospitals_data){
			d3.json(primaryQueryUrl).then(function(primaries_data){
				d3.json(votingQueryUrl).then(function(vcenters_data){
					d3.json(tempQueryUrl).then(function(temps_data){
						buildTemp(temps_data['features']);
						createMap(bikes_data['data']['bikes'], stations_data['features'], hospitals_data['features'], primaries_data['features'], vcenters_data['features']);	
					});
				});
			});
		});
	});
	// createFeatures(data.features);
});

// function createFeatures(earthquakeData) {

// 	// Define a function we want to run once for each feature in the features array
// 	// Give each feature a popup describing the place and time of the earthquake
// 	function onEachFeature(feature, layer) {
// 	layer.bindPopup("<h3>" + feature.properties.place +
// 	  "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
// 	}

// 	// Create a GeoJSON layer containing the features array on the earthquakeData object
// 	// Run the onEachFeature function once for each piece of data in the array
// 	var earthquakes = L.geoJSON(earthquakeData, {
// 	// onEachFeature: onEachFeature
// 		// style: 
// 	});

// 	// Sending our earthquakes layer to the createMap function
// 	createMap(earthquakes);
// }

function buildTemp(temps){
	var temp_panel=d3.select('#temp-data');
	temp_panel.html("<p><b>Current Weather: </b></p>");
	Object.entries(temps[0]['attributes']).forEach(([key, value])=>{
		temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`);
	});
};

function createMap(bikes, stations, hospitals, primaries, vcenters, temps) {
	// An array which will be used to store created cityMarkers
	
	// console.log(stationsFeatures.map(feature=>feature['properties']['NAME']))
	// console.log(stationsFeatures[0]['properties']['NAME']);
	// var stationLines=[];
	// for (var i=0; i<stationsFeatures.length; i++) {
	// 	stationLines.push(
	// 		L.polyline(stationsFeatures[i]['geometry']['paths'], {color: 'red'})
	// 	);
	// console.log(hospitals[0]);
	// };

	function distance(lat1,lon1,lat2,lon2){
		var R = 6371; // km
		return Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
		              Math.cos(lat1)*Math.cos(lat2) *
		              Math.cos(lon2-lon1)) * R;
	};
	function makeTweetFilter(circleCenterLatitude, circleCenterLongitude, circleRadiusInMi){
	   var circleRadiusInKm = circleRadiusInMi * 1.6;
	   return function tweetWithinCircle(tweet){
	      return distance(circleCenterLatitude, circleCenterLongitude, tweet.lat, tweet.lon) <= circleRadiusInKm;
	   }
	};
	// console.log(tweetsWithinCircle);

	var vcenterMarkers=[];
	var vcenterUnder=[];
	for (var i = 0; i < vcenters.length; i++) {
  		var myFilter = makeTweetFilter(vcenters[i]['geometry']['y'], vcenters[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var tweetsWithinCircle = bikes.filter(myFilter);
		// if (tweetsWithinCircle>0) {
			// vcenterUnder+=1;
		// };
		vcenterUnder.push(tweetsWithinCircle);
	  	vcenterMarkers.push(
	    	// L.circle([primaries[i]['geometry']['y'], primaries[i]['geometry']['x']]).bindPopup("<h6>" + primaries[i]['attributes']['PrimaryCarePt.NAME'] + "</h6><h6>"  + primaries[i]['attributes']['PrimaryCarePt.ADDRESS'] + "</h6><h6>" + tweetsWithinCircle.length + "</h6>")
	    	L.circle([vcenters[i]['geometry']['y'], vcenters[i]['geometry']['x']], {radius: 800, stroke: false})
	  	);
	  	vcenterMarkers.push(
	    	L.marker([vcenters[i]['geometry']['y'], vcenters[i]['geometry']['x']], {opacity: .5}).bindPopup("<h6>" + vcenters[i]['attributes']['LOCATION'] + "</h6><h6>"  + vcenters[i]['attributes']['StAddr'] + "</h6><h6>"  + vcenters[i]['attributes']['USER_VOTING_SPACE'] + "</h6><h6>VPM: " + tweetsWithinCircle.length + "</h6>")
	  	);
	};
	var vcenterLayer = L.layerGroup(vcenterMarkers);

	var stationLayer = L.geoJSON(stations, {
		// onEachFeature: onEachFeature
		style: feature=> ({color: feature['properties']['NAME'], weight: 8, opacity: 1})
	});

	var primaryMarkers=[];
	var primaryUnder=[]
	for (var i = 0; i < primaries.length; i++) {
  		var myFilter = makeTweetFilter(primaries[i]['geometry']['y'], primaries[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var tweetsWithinCircle = bikes.filter(myFilter);
		// if (tweetsWithinCircle>0) {
		// 	primaryUnder+=1;
		// };
		primaryUnder.push(tweetsWithinCircle);
		// console.log(tweetsWithinCircle);
  		// loop through the cities array, create a new marker, push it to the cityMarkers array
	  	primaryMarkers.push(
	    	// L.circle([primaries[i]['geometry']['y'], primaries[i]['geometry']['x']]).bindPopup("<h6>" + primaries[i]['attributes']['PrimaryCarePt.NAME'] + "</h6><h6>"  + primaries[i]['attributes']['PrimaryCarePt.ADDRESS'] + "</h6><h6>" + tweetsWithinCircle.length + "</h6>")
	    	L.circle([primaries[i]['geometry']['y'], primaries[i]['geometry']['x']], {radius: 800, stroke: false})
	  	);
	  	primaryMarkers.push(
	    	// L.circle([primaries[i]['geometry']['y'], primaries[i]['geometry']['x']]).bindPopup("<h6>" + primaries[i]['attributes']['PrimaryCarePt.NAME'] + "</h6><h6>"  + primaries[i]['attributes']['PrimaryCarePt.ADDRESS'] + "</h6><h6>" + tweetsWithinCircle.length + "</h6>")
	    	L.marker([primaries[i]['geometry']['y'], primaries[i]['geometry']['x']], {opacity: .5}).bindPopup("<h6>" + primaries[i]['attributes']['PrimaryCarePt.NAME'] + "</h6><h6>"  + primaries[i]['attributes']['PrimaryCarePt.ADDRESS'] + "</h6><h6>VPM: " + tweetsWithinCircle.length + "</h6>")
	  	);
	};
	var primaryLayer = L.layerGroup(primaryMarkers);

	var stationLayer = L.geoJSON(stations, {
		// onEachFeature: onEachFeature
		style: feature=> ({color: feature['properties']['NAME'], weight: 8, opacity: 1})
	});

	var hospitalMarkers=[];
	var hospitalUnder=[];
	for (var i = 0; i < hospitals.length; i++) {
  		var myFilter = makeTweetFilter(hospitals[i]['geometry']['y'], hospitals[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var tweetsWithinCircle = bikes.filter(myFilter);
		// if (tweetsWithinCircle>0) {
		// 	hospitalsUnder+=1;
		// };
		hospitalUnder.push(tweetsWithinCircle);
  		// loop through the cities array, create a new marker, push it to the cityMarkers array
	  	hospitalMarkers.push(
	    	L.circle([hospitals[i]['geometry']['y'], hospitals[i]['geometry']['x']], {radius: 800, stroke: false})
	  	);
	  	hospitalMarkers.push(
	    	L.marker([hospitals[i]['geometry']['y'], hospitals[i]['geometry']['x']], {opacity: .5}).bindPopup("<h6>" + hospitals[i]['attributes']['NAME'] + "</h6><h6>"  + hospitals[i]['attributes']['ADDRESS'] + "</h6><h6>VPM: " + tweetsWithinCircle.length + "</h6>")
	  	);
	};
	var hospitalLayer = L.layerGroup(hospitalMarkers);

	var stationLayer = L.geoJSON(stations, {
		// onEachFeature: onEachFeature
		style: feature=> ({color: feature['properties']['NAME'], weight: 8, opacity: 1})
	});

	var scooterIcon = L.icon({
		iconUrl: 'assets/images/kick-scooter.png',
		iconSize:     [25, 25], // size of the icon
	});
	var bikeMarkers = [];
	var reserved_status=[];
	var disabled_status=[];
	for (var i = 0; i < bikes.length; i++) {
		reserved_status.push(bikes[i]['is_reserved'])
		disabled_status.push(bikes[i]['is_disabled'])
		// loop through the cities array, create a new marker, push it to the cityMarkers array
	  	bikeMarkers.push(
	    	L.marker([bikes[i]['lat'], bikes[i]['lon']], {icon: scooterIcon}).bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>")// + "</h6><h6>"  + bikes[i]['is_reserved'] + "</h6><h6>" + bikes[i]['is_disabled'] + "</h6>")
	  	);
	};
	var uniqueReserved = Array.from(new Set(reserved_status));
	var uniqueDisabled = Array.from(new Set(disabled_status));
	// console.log(uniqueDisabled);
	// console.log(uniqueReserved);


	// Add all the cityMarkers to a new layer group.
	// Now we can handle them as one group instead of referencing each individually
	var bikeLayer = L.layerGroup(bikeMarkers);

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

	// Define a baseMaps object to hold our base layers
	var baseMaps = {
	"Street Map": streetmap,
	"Dark Map": darkmap
	};

	// Create overlay object to hold our overlay layer
	var overlayMaps = {
		bikes: bikeLayer, 
		stations: stationLayer, 
		hospitals: hospitalLayer, 
		'primary care facilities': primaryLayer,
		'voting centers': vcenterLayer
	};

	// Create our map, giving it the streetmap and earthquakes layers to display on load
	var myMap = L.map("map", {
	center: [
	  38.906, -77.03
	],
	zoom: 13,
	layers: [streetmap, bikeLayer]
	// layers: [darkmap, bikeLayer, stationLayer]
	});

	// L.marker([38.91, -77.04], {icon: greenIcon}).addTo(myMap);
	L.control.layers(baseMaps, overlayMaps, {
	collapsed: true
	}).addTo(myMap);


	var pctUnder=[hospitalUnder.map(hospital=>hospital.length).filter(count=>count==0).length/hospitalUnder.length, 
			primaryUnder.map(primary=>primary.length).filter(count=>count==0).length/primaryUnder.length,
			vcenterUnder.map(vcenter=>vcenter.length).filter(count=>count==0).length/vcenterUnder.length
			]

	var trace={
		y: pctUnder, 
		x: ['hospitals', 'primary care', 'voting center'], 
		type:'bar',
		marker: {
			color: ['green', 'green', 'orange']
		}
	}
	// var data = [trace1, trace2, trace3];
	var layout_1 = {
		title: "'Bar' Chart", 
		margin: {
			't': 12, 
			'b': 25, 
			'l': 25, 
			'r': 0, 
			'pad': 0
		}, 
		font: {
			'size': 10
		}, 
		xaxis: {
			type: 'category'
		},
		title: {
		    font: {
			    family: 'Courier New, monospace',
      			size: 10
			}, 
			text: '<b>% of Essential Services w/o Coverage</b>'
		}
	};
	var layout_2 = {
		// title: "'Bar' Chart", 
		margin: {
			't': 12, 
			'b': 25, 
			'l': 25, 
			'r': 0, 
			'pad': 0
		}, 
		font: {
			'size': 10
		},
		title: {
		    font: {
			    family: 'Courier New, monospace',
      			size: 10
			}, 
			text: '<b># of Healthcare Facilities per Coverage Lvl</b>'
		}
		// }, 
		// yaxis: {
		// 	// type: 'category', 
		// 	// range: d3.extent(primaryUnder.map(primary=>parseInt(primary.length)))
		// 	// range: [0, 50]
		// }
	};
	var layout_3 = {
		// title: "'Bar' Chart", 
		margin: {
			't': 12, 
			'b': 25, 
			'l': 25, 
			'r': 0, 
			'pad': 0
		}, 
		font: {
			'size': 10
		},
		title: {
		    font: {
			    family: 'Courier New, monospace',
      			size: 10
			}, 
			text: '<b># of Voting Centers per Coverage Lvl</b>'
		}
		// }, 
		// yaxis: {
		// 	// type: 'category', 
		// 	// range: d3.extent(primaryUnder.map(primary=>parseInt(primary.length)))
		// 	// range: [0, 50]
		// }
	};
	Plotly.newPlot("bar", [trace], layout_1);
	var healthcareUnder=hospitalUnder.concat(primaryUnder)	
	console.log(healthcareUnder.map(hc=>parseInt(hc.length)).sort(number=>parseInt(number))) 
	// console.log(hospitalUnder.map(hospital=>parseInt(hospital.length)))
	// console.log(hospitalUnder.map(hospital=>hospital.length).sort())
	var trace = {
    	x: healthcareUnder.map(hc=>parseInt(hc.length)).sort(number=>parseInt(number)), 
    	type: 'histogram',
    	marker: {
    		color: 'green'
    	}
	};
	Plotly.newPlot('hist_1', [trace], layout_2);

	// console.log(primaryMarkers.length)
	// console.log(hospitalMarkers.length)
	// console.log(primaryUnder.map(primary=>parseInt(primary.length)))
	// // console.log(primaryUnder.map(primary=>parseInt(primary.length)).sort(number=>parseInt(number)))
	console.log(vcenterMarkers.length);
	var trace = {
    	x: vcenterUnder.map(vc=>parseInt(vc.length)).sort(number=>parseInt(number)), 
    	type: 'histogram',
    	marker: {
    		color: 'orange'
    	}
	};
	Plotly.newPlot('hist_2', [trace], layout_3);

	// var trace = {
 //    	y: vcenterUnder.map(vcenter=>parseInt(vcenter.length)).sort(), 
 //    	type: 'histogram',
	// };
	// Plotly.newPlot('hist_3', [trace], layout);
}
