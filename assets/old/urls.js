var timeStart=Date.now()
var timeCount=1;
var timeList=[];
var record={};
var povCountList=[]
var othersCountList=[];
var povRemCountList=[]
var othersRemCountList=[];
var timeFrame=15;
var tableRecords=15;
compInfo.map(comp=>comp['name']).forEach(name=>record[name]={'features':[]});
var timeInterval=10000;
var prevFeatures=[];
var updatedFeatures=[];
var censusFeatures=[];
var combinedCensusRecord={};
var vcFeatures=[];
var bikeLayer;
var map; 
var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';
// var censusQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Demographic_WebMercator/MapServer/36/query?where=1%3D1&outFields=TRACTID,POP10,HOUSING10&outSR=4326&f=json';
var censusQueryUrl='/assets/data/census.json'
var vcQueryUrl='/assets/data/voting.json' //vc is voting center

function masterClock(){
	timeList=resetWindow(timeList);
	timeList.push(formatTime(Date.now()));
};

async function getCensus(){
	var response=await fetch(censusQueryUrl);
	var censusData=await response.json();
	censusFeatures=censusData['features'];
	console.log('Census Updated');
}

async function getVoting(){
	var response=await fetch(vcQueryUrl);
	var vcData=await response.json();
	vcFeatures=vcData['features'];
	console.log('Voting Centers Updated');
}

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
	// var tempF=tempData['features'][0]['attributes']['AIRTEMP'];
	// tempList=resetWindow(tempList);
	// tempList.push(tempF.substring(0, tempF.length-1)); //add to list for chart
	// chartLine(tempList, 'tempLine', 'Temp');
};

function countCensus(features){
	var newCensusRecord={};
	if (features.length>0){
		features.forEach(feature=>{
			var featureTracts=censusFeatures.filter(tract=>inside([feature['lat'], feature['lon']], L.GeoJSON.coordsToLatLngs(tract['geometry']['rings'][0]))==true);
			featureTracts.forEach(tract=>{
			var tractId=tract['attributes']['TRACTID']
				if (newCensusRecord[tractId]){
					newCensusRecord[tractId]+=1
				} else {
					newCensusRecord[tractId]=1
				};
				// console.log(`bike rented at: ${tractId}`);
			});
		});
	};
	// console.log(remRecord);
	return newCensusRecord;
};

function tallyCensus(pov){
	// var combinedCensusRecord=censusRecord;
	var allRecords=Object.entries(record).map(comp=>comp[1]['remCensus']);
	allRecords.forEach(record=>{
		Object.entries(record).forEach(tract=>{
			// console.log(tract);
			if (combinedCensusRecord[tract[0]]){
				combinedCensusRecord[tract[0]]=combinedCensusRecord[tract[0]]+tract[1]
			} else {
				combinedCensusRecord[tract[0]]=tract[1]
			};
		});
	});
	buildRankTable(combinedCensusRecord, 'spin');
};

function buildRankTable(censusRecord, compName){
	var sortedRecord = Object.entries(censusRecord)
	    .sort(([,a],[,b])=>b-a)
	    .slice(0, tableRecords);
	var recordPanel=document.getElementById('record');
	var textNode='<h6 style="margin-top: 0px;">Current Record: </h6>';
	textNode+=`<table><thead><th style="width: 50%">Tract ID</th><th style="width: 35%">Count</th><th style="width: 15%">${compName}</th></thead><tbody>`;
	sortedRecord.forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<tr><td>${key}</td><td>${value}</td><td>${record['spin']['allCensus'][key]? record['spin']['allCensus'][key]: 0}</tr>`;
	});
	textNode+='</tbody></table>';
	recordPanel.innerHTML=textNode;
};

async function testUpdate(){
	var proxyurl='';
	for (i=0; i<compInfo.length; i++){
		var response=await fetch(proxyurl+compInfo[i]['url']+'_'+(timeCount%2)+'.json');
		var data=await response.json();
		var features=data;
		compInfo[i]['layers'].forEach(key=>{
			features=features[key];
		});
		var compName=compInfo[i]['name']
		// var updatedFeatures=features;
		// var [newFeatures, remFeatures]=calcDifference(updatedFeatures, prevFeatures);
		var [newFeatures, remFeatures]=calcDifference(features, record[compName]['features']);
		// record[compName]={};
		record[compName]['features']=features;
		record[compName]['count']=features.length;
		// record[compName]['features']=updatedFeatures;
		record[compName]['remFeatures']=remFeatures;
		record[compName]['remCount']=remFeatures.length;
		record[compName]['remCensus']=countCensus(remFeatures);
		record[compName]['allCensus']=combineObj(record[compName]['allCensus'], record[compName]['remCensus'])
		// record[compInfo[i]['name']]['prevFeatures']=updatedFeatures
		// console.log(record);
	};
	// prevFeatures=updatedFeatures;
	// console.log(record);
	console.log('Bikes Updated');
	// return record;
};

function distance(lat1,lon1,lat2,lon2){
	var R=6371; // km
	return Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
	              Math.cos(lat1)*Math.cos(lat2) *
	              Math.cos(lon2-lon1)) * R;
};

function makeBikesFilter(circleCenterLatitude, circleCenterLongitude, circleRadiusInMi){
   var circleRadiusInKm=circleRadiusInMi*1.6;
   return function bikesWithinCircle(bike){
      return distance(circleCenterLatitude, circleCenterLongitude, bike['lat'], bike['lon'])<=circleRadiusInKm;
   };
};

function updateBikeMap(pov){
	var bikes=record[pov]['features'];
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

function vcHist(pov){
	var povVCList=[];
	var othersVCList=[];
	// var povFeatures=record[pov]['features']
	// var othersFeatures=record
	for (var i=0; i<vcFeatures.length; i++) {
  		var myFilter=makeBikesFilter(vcFeatures[i]['geometry']['y'], vcFeatures[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var povBikesWithinCircle=record[pov]['features'].filter(myFilter);
		var othersBikeWithinCircle=[].concat(...Object.entries(record).filter(comp=>comp[0]!='spin').map(comp=>comp[1]['features'])).filter(myFilter);
		// if (tweetsWithinCircle>0) {
			// vcenterUnder+=1;
		// };
		povVCList.push(povBikesWithinCircle.length);
		othersVCList.push(othersBikeWithinCircle.length);
	};
	// console.log(othersBikeWithinCircle);
	// console.log(povVCList);
	// console.log(othersVCList);
	plotHists('vcHist', 'VC Distribution', povVCList, othersVCList);
};

// testUpdate().then(_=>plotRecord());//.then(test=>console.log(test));
// testUpdate().then(updatedRecord=>console.log(Object.entries(updatedRecord).map(comp=>comp[1]).reduce((a,b)=>a+b, 0)));//.then(test=>console.log(test));
// testUpdate().then(()=>console.log(Object.entries(record).map(comp=>comp[1]).reduce((a,b)=>a+b, 0)));//.then(test=>console.log(test));
var map=initMap();
buildTempTable();
getCensus();
getVoting(); //.then(_=>console.log('Census Updated'))
//.then(_=>{
testUpdate().then(()=>{
	// console.log(record);
	// console.log(Object.entries(record).map(comp=>comp[1]['count']).reduce((a,b)=>a+b, 0));
	// timeCountList.push(timeCount);
	// timeCountList=resetWindow(timeCountList);
	masterClock();
	updateBikeMap('spin');
	// console.log(timeList);
	// plotRecord();
	compBar('spin');
	// buildRankTable('spin');
	tallyCensus('spin');
	vcHist('spin');
	});//.then(test=>console.log(test));
// });

function combineObj(a, b){
	if (a){
		Object.entries(b).forEach(([tract, count])=>{
			if (a[tract]){
				a[tract]=a[tract]+count; 
			} else {
				a[tract]=count;
			};
		});
	} else { 
		a=b;
	};
	return a;
}; 

function compBar(pov){
	var povCount=record[pov]['count'];
	var povRemCount=record[pov]['remCount']
	var othersCount=Object.entries(record).map(comp=>comp[1]['count']).reduce((a,b)=>a+b, 0)-povCount;
	var othersRemCount=Object.entries(record).map(comp=>comp[1]['remCount']).reduce((a,b)=>a+b, 0)-povRemCount;
	console.log(Object.entries(record).map(comp=>comp[1]['remCount']));
	console.log(othersRemCount);
	// compRecord['others']=Object.entries(record).filter(comp=>comp[0]!='spin').map(comp=>comp[1]).reduce((a,b)=>a+b, 0)
	povCountList=resetWindow(povCountList);
	othersCountList=resetWindow(othersCountList);
	povCountList.push(povCount);
	othersCountList.push(othersCount);
	povRemCountList=resetWindow(povRemCountList);
	othersRemCountList=resetWindow(othersRemCountList);
	povRemCountList.push(povRemCount);
	othersRemCountList.push(othersRemCount);
	plotBars('totalBar', 'Total Available', povCountList, othersCountList);
	plotBars('rentBar', 'Recently Rented', povRemCountList, othersRemCountList);
};

function resetWindow(ary){ 
	if (ary.length>=timeFrame){
		ary=ary.slice(1, timeFrame);
	};
	return ary;
};

function updateCounter(){
	var counterPanel=document.getElementById('counter');
	counterPanel.innerHTML=`<h3>${(timeCount*timeInterval/60000).toFixed(2)} mins</h3>`;
};

function plotHists(loc, chartTitle, povCountList, othersCountList){
	var tracePov={
		x: povCountList,
		type: 'histogram', 
		name: 'spin', 
		opacity: 0.5, 
		xbins: {
			// end: 100, 
			size: 10, 
			start: 0
		}, 
		marker: {
			color: 'orange'	
		}
	};
	var traceOthers={
		x: othersCountList,
		type: 'histogram', 
		name: 'others', 
		opacity: 0.5, 
		xbins: {
			// end: 100, 
			size: 10, 
			start: 0
		}, 
		marker: {
			color: 'blue'	
		}
	};
	var layout={
		margin: {
			't': 20, 
			'b': 30, 
			'l': 30, 
			'r': 10, 
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
			text: chartTitle
		},
		barmode: 'overlay', 
		showlegend: false
	};
	Plotly.newPlot(loc, [tracePov, traceOthers], layout);
};

function plotBars(loc, chartTitle, povCountList, othersCountList){
	var tracePov={
		x: timeList,
		y: povCountList, 
		type: 'bar', 
		name: 'spin', 
		marker: {
			color: 'orange'	
		}
	};
	var traceOthers={
		x: timeList,
		y: othersCountList,
		type: 'bar', 
		name: 'others', 
		marker: {
			color: 'blue'	
		}
	};
	var layout={
		margin: {
			't': 20,  
			'b': 30, 
			'l': 30, 
			'r': 10, 
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
			text: chartTitle
		},
		barmode: 'stack', 
		showlegend: false
	};
	Plotly.newPlot(loc, [tracePov, traceOthers], layout);
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
    };
    return inside;
};

function initMap(){
	// buildTempTable();
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
		center: [38.906, -77.03],
		zoom: 13,
		layers: [streetmap]
	// layers: [streetmap, bikeLayer]
	// layers: [darkmap, bikeLayer, stationLayer]
	});
	return myMap;
};

setInterval(()=>{
	updateCounter();
	timeCount+=1;
	// timeCountList.push(timeCount);
	// timeCountList=resetWindow(timeCountList);
	testUpdate()
		.then(()=>{
			// console.log(record);
			// console.log(Object.entries(record).map(comp=>comp[1]['count']).reduce((a,b)=>a+b, 0));
			masterClock();
			updateBikeMap('spin');
			// console.log(timeList);
			// plotRecord();
			compBar('spin', 'count');
			tallyCensus('spin');
			vcHist('spin');
			// buildRankTable('spin');
		}).catch(error=>console.log(error)); //an async functino by definition returns a promise
}, timeInterval);

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

//formatTime converts UNIX to time
function formatTime(unixNum){
	var date=new Date(unixNum);
	var hours=date.getHours();
	var minutes='0'+date.getMinutes();
	var seconds='0'+date.getSeconds();
	return hours+':'+minutes.substr(-2)+':'+seconds.substr(-2);
};

// plotRecord();
// plot();

// updateCounts();
// console.log(record);
// .then(console.log(record));
// getData('skip');



// getData('lyft');

// setInterval(()=>{
// 	masterClock();
// 	counter+=1
// 	updateCounter();
// 	// buildTempTable().then(response=>console.log('Temperature Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
// 	buildBikeTable().then(response=>console.log('Bikes Refreshed')).catch(error=>console.log(error)); //an async functino by definition returns a promise
// 	buildRankTable();
// 	// var millis=Date.now()-start;
// 	// console.log(`seconds elapsed=${millis/1000}`);
// }, timeInterval);