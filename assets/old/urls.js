var queryUrl=[{ 
		name: 'lyft', 
		url: 'https://s3.amazonaws.com/lyft-lastmile-production-iad/lbs/dca/free_bike_status.json', 
		permit: 1020, 
		proxy: true, 
		layers: ['data', 'bikes']
	}, {
		name: 'lime', 
		url: 'https://data.lime.bike/api/partners/v1/gbfs/washington_dc/free_bike_status.json', 
		permit: 720, 
		proxy: true, 
		layers: ['data', 'bikes']
	}, { 
		name: 'spin', 
		url: 'https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status', 
		permit: 1720, 
		proxy: false,
		layers: ['data', 'bikes']
	}, {
		name: 'skip', 
		url: 'https://us-central1-waybots-production.cloudfunctions.net/ddotApi-dcFreeBikeStatus', 
		permit: 2500, 
		proxy: true, 
		layers: ['bikes']
	}, {
		name: 'bird', 
		url: 'https://gbfs.bird.co/dc', 
		permit: 720, 
		proxy: false, 
		layers: ['data', 'bikes']
	}, {
		name: 'razor', 
		url: 'https://razorapi.net/api/v1/gbfs/Washington%20DC/free_bike_status.json', 
		permit: 720, 
		proxy: true, 
		layers: ['data', 'bikes']
	}];

async function getData(compName){
	var compDtl=queryUrl.find(comp=>comp['name']==compName);
	if (compDtl['proxy']){
		proxyurl = "https://cors-anywhere.herokuapp.com/";
	} else {
		proxyurl='';
	};
	// console.log(compDtl['proxy']);
	// console.log(proxyurl);
	// console.log(compDtl);
	// var response=await fetch(proxyurl+compDtl['url']);
	// var data=await response.json();
	fetch(proxyurl+compDtl['url'])
	.then(response=>response.json())
	.then(data=>{
		// reserved=data['data']['bikes'].filter(bike=>bike['is_reserved']==1);
		// console.log(reserved.length);
		// console.log(data);
		var features=data;
		compDtl['layers'].forEach(key=>{
			features=features[key]
		});
	});
	console.log(`${compName}: ${features.length}`);
	// });
};

function updateCounts(urls){
	urls.forEach(comp=>{
		getData(comp['name'])
	});
};

updateCounts(queryUrl);

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