// fetch('https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status').then(response=>response['body'].getReader().read().then(data=>console.log(data)));
const timeFrame=10; //timeFrame is the maximum number of data points
const timeInterval=30000; //timeInterval is the frequency of updates measured in milliseconds (1000ms=1s)
var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';
var spinQueryUrl = "https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";
var censusQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Demographic_WebMercator/MapServer/36/query?where=1%3D1&outFields=TRACTID,POP10,HOUSING10&outSR=4326&f=json';
var lyftQueryUrl='https://s3.amazonaws.com/lyft-lastmile-production-iad/lbs/dca/free_bike_status.json';
var razorQueryUrl='https://razorapi.net/api/v1/gbfs/Washington%20DC/free_bike_status.json';

// function buildTempTable(temp_data){
// 	var temp_panel=document.getElementById('temp');
// 	var textNode='<p><b>Current Weather: </b></p>';
// 	Object.entries(temp_data['features'][0]['attributes']).forEach(([key, value])=>{
// 		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`);
// 		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
// 	});
// 	temp_panel.innerHTML=textNode;
// };
// fetch(tempQueryUrl)
// 	.then(response=>response.json())
// 	.then(data=>{
// 		console.log(data);
// 		buildTempTable(data);
// 	})
// 	.catch(error=>console.log(error));

var timeStart=Date.now()
var counter=0;
var tempList=[];
var timeList=[];
var bikeCountList=[];
var bikeIdList=[];
var newCountList=[];
var remCountList=[];
var bikeLayer;
var censusPoly;
var bikeRemLayer;
var prevBikeFeatures=[];
var bikeFeatures;
var remRecord={};

function masterClock(){
	timeList=resetTimeFrame(timeList);
	timeList.push(formatTime(Date.now()));
};

function buildRankTable(){
	var sortedRecord = Object.entries(remRecord)
	    .sort(([,a],[,b])=>b-a)
	    // .slice(0, 5) //only want the top 5 results
	    // .reduce((r, [key, value]) => ({ ...r, [key]: value }), {});
    var recordPanel=document.getElementById('record');
	var textNode='<h6 style="margin-top: 0px;">Current Record: </h6>';
	textNode+='<table><thead><th>Tract ID</th><th>Count</th></thead><tbody>';
	// textNode+='<table><thead><th style="padding: 0 15px">Tract ID</th><th style="padding: 0 15px">Count</th></thead><tbody>';
	sortedRecord.forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<tr><td>${key}</td><td>${value}</td></tr>`;
	});
	textNode+='</tbody></table>'
	recordPanel.innerHTML=textNode;
};

async function buildTempTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(tempQueryUrl); //await the result of fetch since it is an asynchronous function
	var tempData=await response.json(); //await the response
	var tempPanel=document.getElementById('temp');
	var textNode='<h6 style="margin-top: 0px;">Current Weather: </h6>';
	Object.entries(tempData['features'][0]['attributes']).forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
	});
	tempPanel.innerHTML=textNode;
	var tempF=tempData['features'][0]['attributes']['AIRTEMP'];
	tempList=resetTimeFrame(tempList);
	tempList.push(tempF.substring(0, tempF.length-1)); //add to list for chart
	chartLine(tempList, 'tempLine', 'Temp');
};

async function buildBikeTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(spinQueryUrl); //await the result of fetch since it is an asynchronous function
	var bikeData=await response.json(); //await the response
	bikeFeatures=bikeData['data']['bikes']
	var bikeCount=bikeFeatures.length;
	// var bikeIdListNew=bikeData['data']['bikes'].map(bike=>bike['bike_id'])
	// var [newList, remList]=calcDifference(bikeIdListNew, bikeIdList);
	var [newFeatures, remFeatures]=calcDifference(bikeFeatures, prevBikeFeatures);
	// bikeIdList=bikeIdListNew;
	bikeCountList=resetTimeFrame(bikeCountList);
	newCountList=resetTimeFrame(newCountList);
	remCountList=resetTimeFrame(remCountList);
	bikeCountList.push(bikeCount);
	newCountList.push(newFeatures.length);
	remCountList.push(remFeatures.length);
	console.log(`new features: ${newFeatures}`);
	console.log(`rem features: ${remFeatures}`);
	// remList=['23b5848e-c7a5-4d65-972a-097920a23299', '9c3e2142-7342-440d-9a9d-97814ee3e922']; //for testing
	updateBikeMap(bikeFeatures);
	// updateRemBikes(findBikeByIds(remList, bikeData['data']['bikes']));
	updateRemBikes(remFeatures);
	chartLine(bikeCountList, 'bikeLine', 'Availble Bikes');
	chartBars([newCountList, remCountList], 'bikeLines');
	prevBikeFeatures=bikeFeatures; //reset prevBikeFeatures for finding difference
};

async function mapCensusTract(){
	var response=await fetch(censusQueryUrl);
	var census=await response.json();
	// Create a Polygon and pass in some initial options
	censusPoly=census['features'];
	censusPoly.forEach(feature=>{
		L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "yellow",
			fillOpacity: 0.25, 
			weight: .25
		}).addTo(map);
	});
	// console.log(inside([38.9, -77.04], L.GeoJSON.coordsToLatLngs(census['features'][0]['geometry']['rings'][0])));
	// var testAry=census['features'].filter(feature=>inside([-77.036873, 38.907192], feature['geometry']['rings'][0])==true);
	// var testAry=census['features'].filter(feature=>inside([38.9072, -77.0369], L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]))==true);
	// // console.log(L.GeoJSON.coordsToLatLngs(census['features'][0]['geometry']['rings'][0]));
	// testAry.forEach(feature=>{
	// 	L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
	// 		color: "black",
	// 		fillColor: "red",
	// 		fillOpacity: 1
	// 	}).addTo(map);
	// });
	// console.log(testAry);
};

function findBikeByIds(findList, bikeFeaturesList){
	// var bikeFeatures=[]
	var bikeFeatures=findList.map(bikeId=>bikeFeaturesList.find(feature=>feature['bike_id']==bikeId));
	return bikeFeatures;
};

//inside function checks if a point (lat, long) is in the polygon
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

function updateRemBikes(bikesRem){
	console.log(bikesRem);
	var bikeRemMarkers=[];
	// if (bikeRemLayer){
	// 	map.removeLayer(bikeRemLayer);
	// };
	var fireworkIcon=L.icon({
		iconUrl: 'assets/images/firework.png',
		iconSize: [50, 50], // size of the icon
	});
	for (var i=0; i<bikesRem.length; i++){
		if (bikesRem[i]){
			bikeRemMarkers.push(L.marker([bikesRem[i]['lat'], bikesRem[i]['lon']], {icon: fireworkIcon}).bindPopup("<h6>ID: " + bikesRem[i]['bike_id'] + "</h6>"));
		};
	};
	// console.log(bikeRemMarkers);
	bikeRemLayer=L.layerGroup(bikeRemMarkers);
	bikeRemLayer.addTo(map);
	updateRemRecord(bikesRem);
};

function countCensus(features){
	var remRecord={}
	if (features.length>0){
		sample=features[0]:
		var featureTracts=censusFeatures.filter(feature=>inside([sample['lat'], sample['lon']], L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]))==true);
		featureTracts.forEach(tract=>{
		var tractId=tract['attributes']['TRACTID']
			if (remRecord[tractId]){
				remRecord[tractId]+=1
			} else {
				remRecord[tractId]=1
			};
			console.log(`bike rented at: ${tractId}`);
		});
	}
	console.log(remRecord);
}

function updateRemRecord(bikesRem){
	if (bikesRem.length>0){
		sample=bikesRem[0];
		var remFeatureTracts=censusPoly.filter(feature=>inside([sample['lat'], sample['lon']], L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]))==true);
		remFeatureTracts.forEach(tract=>{
			var tractId=tract['attributes']['TRACTID']
			if (remRecord[tractId]){
				remRecord[tractId]+=1
			} else {
				remRecord[tractId]=1
			};
			console.log(`bike rented at: ${tractId}`);
		});
		// testAry.forEach(feature=>{
		// 	L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
		// 		color: "black",
		// 		fillColor: "red",
		// 		fillOpacity: 1
		// 	}).addTo(map);
		// });
	};
	console.log(remRecord);
};

function updateBikeMap(bikes){
	// var i = 0;
	// map.eachLayer(function(){ i += 1; });
	// console.log('Map has', i, 'layers.');
	if (bikeLayer){
		map.removeLayer(bikeLayer);
	};
	var scooterIcon=L.icon({
		iconUrl: 'assets/images/kick-scooter.png',
		iconSize: [10, 10], // size of the icon
	});
	var bikeMarkers=[];
	for (var i=0; i<bikes.length; i++) {
	  	bikeMarkers.push(L.marker([bikes[i]['lat'], bikes[i]['lon']], {icon: scooterIcon}).bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>"));// + "</h6><h6>"  + bikes[i]['is_reserved'] + "</h6><h6>" + bikes[i]['is_disabled'] + "</h6>")
	};
	bikeLayer=L.layerGroup(bikeMarkers);
	bikeLayer.addTo(map);
	// var i = 0;
	// map.eachLayer(function(){ i += 1; });
	// console.log('Map has', i, 'layers.');
};

//resetTimeFrame makes sure that only timeFrame elements in the list
function resetTimeFrame(ary){ 
	if (ary.length>=timeFrame){
		ary=ary.slice(1, timeFrame);
	};
	return ary
};

//formatTime converts UNIX to time
function formatTime(unixNum){
	var date=new Date(unixNum);
	var hours=date.getHours();
	var minutes='0'+date.getMinutes();
	var seconds='0'+date.getSeconds();
	return hours+':'+minutes.substr(-2)+':'+seconds.substr(-2);
};
//calcDifference figures the differential between two lists
function calcDifference(aryNow, aryPrior){
	// aryNow=currentList
	var newEle=aryNow.filter(ele=>!aryPrior.map(feature=>feature['bike_id']).includes(ele['bike_id']));
	var eleRem=aryPrior.filter(ele=>!aryNow.map(feature=>feature['bike_id']).includes(ele['bike_id']));
	// var bikeRemFeatures=eleRem.map(bikeId=>aryPrior.find(feature=>feature['bike_id']==bikeId));
	// console.log(newEle);
	// console.log(eleRem);
	return [newEle, eleRem];
};

function chartBars(dataLists, plotID){
	var chartLabels=[{
		text: 'new',
		color: 'green'
	}, {
		text: 'rem', 
		color: 'orange'
	}];
	var data=[];
	// console.log(dataLists);
	dataLists.forEach((dataList, i)=>{
		var trace={
			type: 'line', 
			x: timeList, 
			y: dataList, 
			name: chartLabels[i]['text'], 
			line: {
				color: chartLabels[i]['color']
			}
		};
		data.push(trace);
	});
	var layout = {
		title: "'Bar' Chart", 
		margin: {
			't': 15, 
			'b': 15, 
			'l': 15, 
			'r': 15, 
			'pad': 0
		}, 
		font: {
			'size': 10
		}, 
		xaxis: {
			type: 'category'
			// textfont: {
			// 	size: 2
			// }
		},
		title: {
		    font: {
			    family: 'Courier New, monospace',
      			size: 10
			}, 
			text: '<b>% of Essential Services w/ 0 VPM</b>'
		}, 
		showlegend: false
	};
	Plotly.newPlot(plotID, data, layout);
};

function chartLine(dataList, plotID, plotTitle){
	var trace={
		type: 'line', 
		y: dataList, 
		x: timeList
		// y: [1, 2, 3]
	};
	var layout = {
		title: "'Bar' Chart", 
		margin: {
			't': 15, 
			'b': 15, 
			'l': 15, 
			'r': 15, 
			'pad': 0
		}, 
		font: {
			'size': 10
		}, 
		xaxis: {
			type: 'category'
			// textfont: {
			// 	size: 2
			// }
		},
		title: {
		    font: {
			    family: 'Courier New, monospace',
      			size: 10
			}, 
			text: plotTitle
		}
	};
	Plotly.newPlot(plotID, [trace], layout);
};

function initMap(){
	var masterPanel=document.getElementById('start');
	masterPanel.innerHTML=`<h6 style="margin-top: 0px">Started: ${formatTime(timeStart)}</h6>`
	var cyclePanel=document.getElementById('cycle');
	cyclePanel.innerHTML=`<p>updates every ${timeInterval/1000} seconds</p>`;
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
		center: [
		  38.906, -77.03
		],
		zoom: 13,
		layers: [streetmap]
	// layers: [streetmap, bikeLayer]
	// layers: [darkmap, bikeLayer, stationLayer]
	});
	return myMap;
};

function updateCounter(){
	var counterPanel=document.getElementById('counter');
	counterPanel.innerHTML=`<h3>${counter*timeInterval/60000} mins</h3>`;
}

//initiatlize
var map=initMap();
masterClock();
buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
mapCensusTract().then(response=>console.log('Census Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
buildBikeTable().then(response=>console.log('Bikes Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise

// var start=Date.now();
setInterval(()=>{
	masterClock();
	counter+=1
	updateCounter();
	// buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
	buildBikeTable().then(response=>console.log('Bikes Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
	buildRankTable();
	// var millis=Date.now()-start;
	// console.log(`seconds elapsed=${millis/1000}`);
}, timeInterval); //measured in milliseconds 1000ms=1s

setInterval(()=>{
	buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
}, timeInterval*5);
// [test1, test2]=calcDifference(['b', 'c', 'd'], ['a', 'b', 'c']);
// console.log(test1);
// console.log(test2);
// console.log(chartLabels);