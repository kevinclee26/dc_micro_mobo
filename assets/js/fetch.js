// fetch('https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status').then(response=>response['body'].getReader().read().then(data=>console.log(data)));
const timeFrame=10; //timeFrame is the maximum number of data points
const timeInterval=30000; //timeInterval is the frequency of updates measured in milliseconds (1000ms=1s)
var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';
var bikesQueryUrl = "https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";

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

var tempList=[];
var timeList=[];
var bikeCountList=[];
var bikeIdList=[];
var newCountList=[];
var remCountList=[];
var chartLabels=[{
		text: 'new',
		color: 'green'
	}, {
		text: 'rem', 
		color: 'orange'
	}];
var bikeLayer;

function masterClock(){
	timeList=resetTimeFrame(timeList);
	timeList.push(formatTime(Date.now()));
};

async function buildTempTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(tempQueryUrl); //await the result of fetch since it is an asynchronous function
	var tempData=await response.json(); //await the response
	var tempPanel=document.getElementById('temp');
	var textNode='<p><b>Current Weather: </b></p>';
	Object.entries(tempData['features'][0]['attributes']).forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
	});
	tempPanel.innerHTML=textNode;
	var tempF=tempData['features'][0]['attributes']['AIRTEMP'];
	tempList=resetTimeFrame(tempList);
	tempList.push(tempF.substring(0, tempF.length-1)); //add to list for chart
	chartBar(tempList, 'tempBar');
};

async function buildBikeTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(bikesQueryUrl); //await the result of fetch since it is an asynchronous function
	var bikeData=await response.json(); //await the response
	var bikeCount=bikeData['data']['bikes'].length;
	var bikeIdListNew=bikeData['data']['bikes'].map(bike=>bike['bike_id'])
	var [newCount, remCount]=calcDifference(bikeIdListNew, bikeIdList);
	bikeIdList=bikeIdListNew;
	bikeCountList=resetTimeFrame(bikeCountList);
	newCountList=resetTimeFrame(newCountList);
	remCountList=resetTimeFrame(remCountList);
	bikeCountList.push(bikeCount);
	newCountList.push(newCount);
	remCountList.push(remCount);
	updateBikeMap(bikeData['data']['bikes']);
	chartBar(bikeCountList, 'bikeBar');
	chartBars([newCountList, remCountList], 'bikeBars');
};

function updateBikeMap(bikes){
	var i = 0;
	map.eachLayer(function(){ i += 1; });
	console.log('Map has', i, 'layers.');
	if (bikeLayer){
		map.removeLayer(bikeLayer);
	};
	var scooterIcon = L.icon({
		iconUrl: 'assets/images/kick-scooter.png',
		iconSize:     [25, 25], // size of the icon
	});
	var bikeMarkers = [];
	for (var i = 0; i < bikes.length; i++) {
	  	bikeMarkers.push(
	    	L.marker([bikes[i]['lat'], bikes[i]['lon']], {icon: scooterIcon}).bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>")// + "</h6><h6>"  + bikes[i]['is_reserved'] + "</h6><h6>" + bikes[i]['is_disabled'] + "</h6>")
	  	);
	};
	bikeLayer = L.layerGroup(bikeMarkers);
	bikeLayer.addTo(map);
	var i = 0;
	map.eachLayer(function(){ i += 1; });
	console.log('Map has', i, 'layers.');
};

//resetTimeFrame makes sure that only timeFrame-1 elements in the list
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
	var newEle=aryNow.filter(ele=>!aryPrior.includes(ele));
	var eleRem=aryPrior.filter(ele=>!aryNow.includes(ele));
	console.log(newEle);
	console.log(eleRem);
	return [newEle.length, eleRem.length];
};

function chartBars(dataLists, plotID){
	var data=[];
	console.log(dataLists);
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

function chartBar(dataList, plotID){
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
			text: '<b>% of Essential Services w/ 0 VPM</b>'
		}
	};
	Plotly.newPlot(plotID, [trace], layout);
};

function initMap(){
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

//initiatlize
var map=initMap();
masterClock();
buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
buildBikeTable().then(response=>console.log('Bikes Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise

// var start=Date.now();
setInterval(()=>{
	masterClock();
	// buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
	buildBikeTable().then(response=>console.log('Bikes Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
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