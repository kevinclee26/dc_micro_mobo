var compInfo=[{ 
	// 	name: 'lyft', //can rehash
	// 	url: '/assets/data/lyft',//.json', 
	// 	// url: 'https://s3.amazonaws.com/lyft-lastmile-production-iad/lbs/dca/free_bike_status.json', 
	// 	permit: 1020, 
	// 	proxy: true, 
	// 	layers: ['data', 'bikes']
	// }, {
	// 	name: 'lime', //can rehash
	// 	url: '/assets/data/lime',//.json', 
	// 	// url: 'https://data.lime.bike/api/partners/v1/gbfs/washington_dc/free_bike_status.json', 
	// 	permit: 720, 
	// 	proxy: true, 
	// 	layers: ['data', 'bikes']
	// }, { 
		name: 'spin', 
		// url: '/assets/data/spin',//.json', 
		url: 'https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status', 
		permit: 1720, 
		proxy: false,
		layers: ['data', 'bikes']
	}, {
		name: 'skip', 
		// url: '/assets/data/skip',//.json', 
		url: 'https://us-central1-waybots-production.cloudfunctions.net/ddotApi-dcFreeBikeStatus', 
		permit: 2500, 
		proxy: true, 
		layers: ['bikes']
	}, {
	// 	name: 'bird', //can rehash
	// 	url: '/assets/data/bird',//.json', 
	//	// url: 'https://gbfs.bird.co/dc', 
	// 	permit: 720, 
	// 	proxy: false, 
	// 	layers: ['data', 'bikes']
	// }, {
		name: 'razor', 
		// url: '/assets/data/razor',//.json', 
		url: 'https://razorapi.net/api/v1/gbfs/Washington%20DC/free_bike_status.json', 
		permit: 720, 
		proxy: true, 
		layers: ['data', 'bikes']
	}];