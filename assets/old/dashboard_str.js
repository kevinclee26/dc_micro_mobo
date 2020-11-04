var timeStart=Date.now()
var timeCount=0;
var timeList=[];
var record={};
var povCountList=[]
var othersCountList=[];
var povRemCountList=[]
var othersRemCountList=[];
var timeFrame=20;
var tableRecords=20;
compInfo.map(comp=>comp['name']).forEach(name=>record[name]={'features':[], 'censusCount':{}, 'featuresTrunc':[]});
var timeInterval=60000;
var prevFeatures=[];
var updatedFeatures=[];
var censusFeatures=[];
var combinedCensusRecord={};
var vcFeatures=[];
var metroFeatures=[];
var bikeLayer;
var map; 
var topCensusLayer;
var metroLayer;
const proxyurl = "https://cors-anywhere.herokuapp.com/";
var vcLayer;
var voteIcon=L.icon({
	iconUrl: 'assets/images/vote.png',
	iconSize: [15, 15], // size of the icon
});
var metroIcon=L.icon({
	iconUrl: 'assets/images/subway.png',
	iconSize: [15, 15], // size of the icon
});
var tempQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/152/query?where=1%3D1&outFields=AIRTEMP,RELATIVEHUMIDITY,VISIBILITY,WINDSPEED&outSR=4326&f=json';
// var censusQueryUrl='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Demographic_WebMercator/MapServer/36/query?where=1%3D1&outFields=TRACTID,POP10,HOUSING10&outSR=4326&f=json';
var censusQueryUrl='/assets/data/census.json'
var vcQueryUrl='/assets/data/voting.json' //vc is voting center
var metroLinesQueryUrl='/assets/data/metro_lines.geojson'
var metroQueryUrl='/assets/data/stations.json'

function masterClock(){
	timeList=resetWindow(timeList);
	timeList.push(formatTime(Date.now()));
};

async function getCensus(){
	var response=await fetch(censusQueryUrl);
	var censusData=await response.json();
	censusFeatures=censusData['features'];
	censusFeatures.forEach(feature=>{
		L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "yellow",
			fillOpacity: 0.05, 
			weight: .5
		}).addTo(map);
	});
	console.log('Census Updated');
};

async function getMetro(){
	var metroResponse=await fetch(metroQueryUrl);
	var metroData=await metroResponse.json();
	metroFeatures=metroData['features'];
	var metroLinesResponse=await fetch(metroLinesQueryUrl);
	var metroLinesData=await metroLinesResponse.json();
	var stationLayer = L.geoJSON(metroLinesData, {
		// onEachFeature: onEachFeature
		style: feature=> ({
			color: feature['properties']['NAME'], 
			weight: 10, 
			opacity: 0.4,
		})
	}).addTo(map);
	var metroMarkers=[];
	metroData['features'].forEach(feature=>{
		// L.circle([feature['geometry']['y'], feature['geometry']['x']], {
		// 	radius: 800, 
		// 	stroke: true, 
		// 	fillOpacity: 0.0,
		// 	fill: true, 
		// 	dashArray: 4,
		// 	opacity: 0.2
		// }).addTo(map);
		metroMarkers.push(L.marker([feature['geometry']['y'], feature['geometry']['x']], {
			opacity: 1, 
			icon: metroIcon
		}));
	});
	metroLayer=L.layerGroup(metroMarkers);
	metroLayer.addTo(map);
	console.log('Metro Updated');
};

async function getVC(){
	var response=await fetch(vcQueryUrl);
	var vcData=await response.json();
	vcFeatures=vcData['features'];
	var vcMarkers=[];
	vcFeatures.forEach(feature=>{
		// L.circle([feature['geometry']['y'], feature['geometry']['x']], {
		// 	radius: 800, 
		// 	stroke: true, 
		// 	fillOpacity: 0.01,
		// 	dashArray: 4,
		// 	opacity: 0.1
		// }).addTo(map);
		L.marker([feature['geometry']['y'], feature['geometry']['x']], {
			opacity: 1, 
			icon: voteIcon
		}).addTo(map);
	});
	vcLayer=L.layerGroup(vcMarkers);
	vcLayer.addTo(map);
	console.log('Voting Centers Updated');
}

async function buildTempTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(tempQueryUrl); //await the result of fetch since it is an asynchronous function
	var tempData=await response.json(); //await the response
	var tempPanel=document.getElementById('temp');
	var textNode='<h5 style="font-weight: bold; margin-top: 0px;">Current Weather: </h5>';
	Object.entries(tempData['features'][0]['attributes']).forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
	});
	tempPanel.innerHTML=textNode;
};

function countCensus(features, census){ //features need to be in [[lat, lon]]
	var newCensusRecord={};
	if (features.length>0){
		features.forEach(feature=>{
			// console.log(feature.split(',').map(parseFloat));
			// var featureTracts=census.filter(tract=>inside(feature.split(',').map(parseFloat), L.GeoJSON.coordsToLatLngs(tract['geometry']['rings'][0]))==true); //this has a bug
			var featureTracts=census.filter(tract=>inside(feature.split(',').map(parseFloat), L.GeoJSON.coordsToLatLngs(tract['geometry']['rings'][0]))==true);
			// console.log(featureTracts);
			featureTracts.forEach(tract=>{
			var tractId=tract['attributes']['TRACTID']
				if (newCensusRecord[tractId]){
					newCensusRecord[tractId]+=1
				} else {
					newCensusRecord[tractId]=1
				};
			});
		});
	};
	return newCensusRecord;
};

function tallyCensus(pov){
	var allRecords=Object.entries(record).map(comp=>comp[1]['remCensus']);
	allRecords.forEach(record=>{
		Object.entries(record).forEach(tract=>{
			if (combinedCensusRecord[tract[0]]){
				combinedCensusRecord[tract[0]]=combinedCensusRecord[tract[0]]+tract[1]
			} else {
				combinedCensusRecord[tract[0]]=tract[1]
			};
		});
	});
	var sortedRecord = Object.entries(combinedCensusRecord)
	    .sort(([,a],[,b])=>b-a)
	    .slice(0, tableRecords);
    var topTracts=sortedRecord.map(tract=>tract[0]);
    // var topCensusFeatures=censusFeatures.filter(feature=>topTracts.includes(feature['attributes']['TRACTID'])); 
    var topCensusFeatures=censusFeatures.filter(feature=>topTracts.indexOf(feature['attributes']['TRACTID'])!==-1); 
    // var povAvailability=countCensus(record[pov]['features'].map(feature=>feature.split(',').map(parseFloat)), topCensusFeatures);
    var povAvailability=countCensus(record[pov]['features'], topCensusFeatures);
    // var othersAvailability=countCensus([].concat(...Object.entries(record).filter(comp=>comp[0]!=pov).map(comp=>comp[1]['features'])).map(feature=>feature.split(',').map(parseFloat)), topCensusFeatures);
    var othersAvailability=countCensus([].concat(...Object.entries(record).filter(comp=>comp[0]!=pov).map(comp=>comp[1]['features'])), topCensusFeatures);
    sortedRecord.forEach(tract=>{
    	tract.push(povAvailability[tract[0]])
    	tract.push(othersAvailability[tract[0]])
	});
    var topCensusMarkers=[]
	if (topCensusLayer){
		map.removeLayer(topCensusLayer);
		// console.log('Removed Top Census Layer');
	};
	topCensusFeatures.forEach(feature=>{
		topCensusMarkers.push(L.polygon(L.GeoJSON.coordsToLatLngs(feature['geometry']['rings'][0]), {
			color: "black",
			fillColor: "orange",
			fillOpacity: 0.25, 
			weight: 1
		}).bindPopup(`<h6>TRACT ID: ${feature['attributes']['TRACTID']}</h6><h6>Main Availability: ${povAvailability[feature['attributes']['TRACTID']]}</h6><h6>Others Availability: ${othersAvailability[feature['attributes']['TRACTID']]}</h6>`));
	});
	topCensusLayer=L.layerGroup(topCensusMarkers);
	topCensusLayer.addTo(map);
	// console.log('Added Top Census Layer');
	buildRankTable(sortedRecord, pov);
};

function buildRankTable(censusRecord, compName){
	var recordPanel=document.getElementById('record');
	var textNode='<h5 style="font-weight: bold; margin-top: 0px; font-size: 10px">Usage Record by Tract ID: (Main/Total)</h5>';
	// textNode+=`<table><thead><th style="width: 25%">Tract ID</th><th style="width: 15%">Tot. Cnt. </th><th style="width: 15%">${compName} Cnt. </th><th style="width: 25%">Avail. Scooters</th></thead><tbody>`;
	textNode+=`<table style="width: 100%; border: 1px solid black;"><thead><th style="font-size: 10px">Tract ID</th><th style="font-size: 10px">Cnt.</th><th style="font-size: 10px">Avail. Scooters</th></thead><tbody>`;
	censusRecord.forEach(([tract, totalCount, compAvail, othersAvail])=>{
		compAvail=compAvail||0;
		othersAvail=othersAvail||0;
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<tr><td style="font-size: 10px">${tract}</td><td style="font-size: 10px">${record[compName]['allCensus'][tract]? record[compName]['allCensus'][tract]: 0}/${totalCount}</td><td style="font-size: 10px">${compAvail}/${compAvail+othersAvail}</td></tr>`;
	});
	textNode+='</tbody></table>';
	recordPanel.innerHTML=textNode;
};

async function bikeUpdate(){
	for (var i=0; i<compInfo.length; i++){
		// var proxyurl='';
		var compName=compInfo[i]['name']
		// console.log(`Attempting ${compInfo[i]['name']}`)
		try {
			if (compInfo[i]['proxy']){
				// var response=await fetch(proxyurl+compInfo[i]['url']+'_'+(timeCount%2)+'.json');
				var response=await fetch(proxyurl+compInfo[i]['url']);
			} else {
				var response=await fetch(compInfo[i]['url']);
			};
				// var response=await fetch(proxyurl+compInfo[i]['url']+'_'+(timeCount%2)+'.json');	
			var data=await response.json();
			var features=data;
			compInfo[i]['layers'].forEach(key=>{
				features=features[key];
			});
			featuresStr=features.map(feature=>[parseFloat(feature['lat']), parseFloat(feature['lon'])].join(','));
			featuresStrTrunc=features.map(feature=>[parseFloat(feature['lat']).toFixed(2), parseFloat(feature['lon']).toFixed(2)].join(','));
			// var remFeatures=calcDiff(record[compName]['features'].map(feature=>[feature['lat'], feature['lon']].join(',')), features.map(feature=>[feature['lat'], feature['lon']]));
			var remFeatures=calcDiffStr(record[compName]['featuresTrunc'], featuresStrTrunc);
			// var [newFeatures, remFeatures]=calcDifference(features, record[compName]['features']);
			record[compName]['features']=featuresStr;
			record[compName]['featuresTrunc']=featuresStrTrunc;
			record[compName]['count']=featuresStr.length;
			record[compName]['remFeatures']=remFeatures;
			record[compName]['remCount']=remFeatures.length;
			// record[compName]['remCount_2']=Object.entries(diff).map(tract=>tract[1]).reduce((a, b)=>a+b, 0);
			record[compName]['remCensus']=countCensus(remFeatures, censusFeatures);
			record[compName]['allCensus']=combineObj(record[compName]['allCensus'], record[compName]['remCensus'])
		} catch (e) {
			console.log(`Failed ${compInfo[i]['name']}`);
			record[compName]['features']=[];
			record[compName]['count']=0;
			record[compName]['remFeatures']=[];
			record[compName]['remCount']=0;
			record[compName]['remCensus']={};
			record[compName]['allCensus']=combineObj(record[compName]['allCensus'], record[compName]['remCensus'])
		}
		// record[compName]['censusCount']=diff;
		// record[compName]['remCount_2']=Object.entries(diff).map(tract=>tract[1]).reduce((a, b)=>a+b, 0);
	};
	console.log('Bikes Updated');
};

function calcDiffDist(a, b){
	b.forEach(ptComp=>{
		var distanceList=a.map(pt=>{
			return distance(pt[0], pt[1], ptComp[0], ptComp[1]);
		});
		var lowest=0
		distanceList.forEach((distance, idx)=>{
			if(distance<distanceList[lowest]){
				lowest=idx;
			};
		});
		if (distanceList[lowest]<50){ //97 meters is threshold
			a.splice(lowest, 1);
		};
	});
};

function calcDiffStr(a, b){ //a is new and b is old
	// var diff={}
	// Object.keys(b).forEach(key=>{
	// 	var diffCount=b[key]-(a[key]? a[key]: 0);
	// 	if (diffCount>0){
	// 		diff[key]=b[key]-(a[key]? a[key]: 0)
	// 	};
	// });
	// return diff;
	b.forEach(element=>delete a[a.indexOf(element)])
	return a.filter(element=>element!=null);
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
		// var bike_lat, var bike_lon=bike.split(',').map(parseFloat);
		var bike_lat, bike_lon
		[bike_lat, bike_lon]=bike.split(',').map(parseFloat)
		// return distance(circleCenterLatitude, circleCenterLongitude, bike['lat'], bike['lon'])<=circleRadiusInKm;
		return distance(circleCenterLatitude, circleCenterLongitude, bike_lat, bike_lon)<=circleRadiusInKm;
	};
};

function updateBikeMap(pov){
	var bikes=record[pov]['features'];
	if (bikeLayer){
		map.removeLayer(bikeLayer);
	};
	var scooterIcon=L.icon({
		iconUrl: 'assets/images/kick-scooter.png',
		iconSize: [10, 10], // size of the icon
	});
	var bikeMarkers=[];
	for (var i=0; i<bikes.length; i++) {
	  	// bikeMarkers.push(L.marker([bikes[i]['lat'], bikes[i]['lon']], {icon: scooterIcon}));//.bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>"));// + "</h6><h6>"  + bikes[i]['is_reserved'] + "</h6><h6>" + bikes[i]['is_disabled'] + "</h6>")
	  	bikeMarkers.push(L.marker(bikes[i].split(',').map(parseFloat), {icon: scooterIcon}));//.bindPopup("<h6>ID: " + bikes[i]['bike_id'] + "</h6>"));// + "</h6><h6>"  + bikes[i]['is_reserved'] + "</h6><h6>" + bikes[i]['is_disabled'] + "</h6>")
	};
	bikeLayer=L.layerGroup(bikeMarkers);
	bikeLayer.addTo(map);
};

function vcHist(pov){
	var povVCList=[];
	var othersVCList=[];
	var vcMarkers=[];
	if (vcLayer){
		map.removeLayer(vcLayer);
	};
	for (var i=0; i<vcFeatures.length; i++) {
  		var myFilter=makeBikesFilter(vcFeatures[i]['geometry']['y'], vcFeatures[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var povBikesWithinCircle=record[pov]['features'].filter(myFilter);
		var othersBikeWithinCircle=[].concat(...Object.entries(record).filter(comp=>comp[0]!=pov).map(comp=>comp[1]['features'])).filter(myFilter);
		povVCList.push(povBikesWithinCircle.length);
		othersVCList.push(othersBikeWithinCircle.length);
		vcMarkers.push(L.marker([vcFeatures[i]['geometry']['y'], vcFeatures[i]['geometry']['x']], {
			opacity: 1, 
			icon: voteIcon
		}).bindPopup(`<h6>Location: ${vcFeatures[i]['attributes']['LOCATION']}"</h6><h6>Hours: ${vcFeatures[i]['attributes']['HOURS']}</h6><h6>Main Availability: ${povBikesWithinCircle.length}</h6><h6>Others Availability: ${othersBikeWithinCircle.length}</h6>`));
	};
	vcLayer=L.layerGroup(vcMarkers);
	vcLayer.addTo(map);
	plotHists('vcHist', 'VC Coverage', povVCList, othersVCList);
};


function metroHist(pov){
	var povMetroList=[];
	var othersMetroList=[];
	var metroMarkers=[];
	if (metroLayer){
		map.removeLayer(metroLayer);
		// console.log('Removed Metro Layer');
	};
	for (var i=0; i<metroFeatures.length; i++) {
  		var myFilter=makeBikesFilter(metroFeatures[i]['geometry']['y'], metroFeatures[i]['geometry']['x'], 22.25);//circle.radiusInMi);
		var povBikesWithinCircle=record[pov]['features'].filter(myFilter);
		var othersBikeWithinCircle=[].concat(...Object.entries(record).filter(comp=>comp[0]!=pov).map(comp=>comp[1]['features'])).filter(myFilter);
		povMetroList.push(povBikesWithinCircle.length);
		othersMetroList.push(othersBikeWithinCircle.length);
		metroMarkers.push(L.marker([metroFeatures[i]['geometry']['y'], metroFeatures[i]['geometry']['x']], {
			opacity: 1, 
			icon: metroIcon
		}).bindPopup(`<h6>ID: ${metroFeatures[i]['attributes']['NAME']}</h6><h6>Line: ${metroFeatures[i]['attributes']['LINE']}</h6><h6>Main Availability: ${povBikesWithinCircle.length}</h6><h6>Others Availability: ${othersBikeWithinCircle.length}</h6>`));
	};
	metroLayer=L.layerGroup(metroMarkers);
	metroLayer.addTo(map);
	// console.log('Added Metro Layer');
	plotHists('metroHist', 'Metro Coverage', povMetroList, othersMetroList);
};

// testUpdate().then(_=>plotRecord());//.then(test=>console.log(test));
// testUpdate().then(updatedRecord=>console.log(Object.entries(updatedRecord).map(comp=>comp[1]).reduce((a,b)=>a+b, 0)));//.then(test=>console.log(test));
// testUpdate().then(()=>console.log(Object.entries(record).map(comp=>comp[1]).reduce((a,b)=>a+b, 0)));//.then(test=>console.log(test));
var map=initMap();
updateCounter();
buildTempTable();
getCensus();
getMetro();
getVC(); //.then(_=>console.log('Census Updated'))
//.then(_=>{
bikeUpdate().then(()=>{
	// timeCountList.push(timeCount);
	// timeCountList=resetWindow(timeCountList);
	masterClock();
	updateBikeMap('spin');
	compBar('spin');
	tallyCensus('spin');
	metroHist('spin');
	vcHist('spin');
});//.then(test=>console.log(test));

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
	var othersCount=Object.entries(record).map(comp=>comp[1]['count']).reduce((a, b)=>a+b, 0)-povCount;
	var othersRemCount=Object.entries(record).map(comp=>comp[1]['remCount']).reduce((a, b)=>a+b, 0)-povRemCount;
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
	plotBars('rentBar', 'Recently Unavailable (Rented)', povRemCountList, othersRemCountList);
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
	var countStart=10;
	// povCountList.filter(count=>count<countStart).length
	var tracePov={
		x: povCountList,
		type: 'histogram', 
		name: `main has ${povCountList.filter(count=>count<countStart).length} with < 10 VPM`, 
		opacity: 0.5, 
		xbins: {
			// end: 100, 
			size: 10, 
			start: countStart
		}, 
		marker: {
			color: 'orange'
		}
	};
	var traceOthers={
		x: othersCountList,
		type: 'histogram', 
		name: `others have ${othersCountList.filter(count=>count<countStart).length} with < 10 VPM`, 
		opacity: 0.5, 
		xbins: {
			// end: 100, 
			size: 10, 
			start: countStart
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
			text: `${chartTitle} out of ${(othersCountList.length+povCountList.length)/2} Sites`
		},
		barmode: 'overlay',
		hovermode: false
		// showlegend: false
	};
	Plotly.newPlot(loc, [tracePov, traceOthers], layout);
};

function plotBars(loc, chartTitle, povCountList, othersCountList){
	var tracePov={
		x: timeList,
		y: povCountList, 
		type: 'bar', 
		name: 'main', 
		opacity: 0.5, 
		marker: {
			color: 'orange'	
		}
	};
	var traceOthers={
		x: timeList,
		y: othersCountList,
		type: 'bar', 
		name: 'others', 
		opacity: 0.5, 
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
		xaxis: {
			dtick: 300*1000/timeInterval
		},
		barmode: 'stack', 
		showlegend: false
		// hovermode: false
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
	var masterPanel=document.getElementById('start');
	masterPanel.innerHTML=`<h5 style="font-weight: bold; margin-top: 0px">Started: ${formatTime(timeStart)}</h5>`
	var cyclePanel=document.getElementById('cycle');
	cyclePanel.innerHTML=`<p>has elapsed<br>updates every ${timeInterval/1000} seconds</p>`;
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
	bikeUpdate()
		.then(()=>{
			masterClock();
			updateBikeMap('spin');
			compBar('spin', 'count');
			tallyCensus('spin');
			metroHist('spin');
			vcHist('spin');
			var i=0;
			map.eachLayer(function(){ i += 1; });
			console.log('Map has', i, 'layers.');
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