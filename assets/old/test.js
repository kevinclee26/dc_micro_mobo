// const proxyurl = "https://cors-anywhere.herokuapp.com/";
// var compQueryUrl='https://us-central1-waybots-production.cloudfunctions.net/ddotApi-dcFreeBikeStatus';

// async function gather(){
	// fetch(proxyurl+compQueryUrl).then(response=>console.log(response));
	// var data=await response.json();

	// var reserved=data['bikes'].filter(bike=>bike['is_reserved']==1);
	// console.log(reserved);
	// console.log(response);
// }

// gather();

// d3.json(compQueryUrl).then(data=>{
// 	console.log(data);
// });
// fetch(proxyurl+compQueryUrl).then(response=>response.text()).then(contents=>console.log(contents)).catch(error=>console.error);
var lyftQueryUrl='https://s3.amazonaws.com/lyft-lastmile-production-iad/lbs/dca/free_bike_status.json';
var limeQueryUrl='https://data.lime.bike/api/partners/v1/gbfs/washington_dc/free_bike_status.json';
var spinQueryUrl="https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status";
var razorQueryUrl='https://us-central1-waybots-production.cloudfunctions.net/ddotApi-dcFreeBikeStatus';
// var birdQueryUrl='https://gbfs.bird.co/dc';
const proxyurl = "https://cors-anywhere.herokuapp.com/";
var birdQueryUrl='https://s3.amazonaws.com/lyft-lastmile-production-iad/lbs/dca/free_bike_status.json';
fetch(proxyurl+razorQueryUrl)
.then(response=>response.json())
.then(data=>{
	// reserved=data['data']['bikes'].filter(bike=>bike['is_reserved']==1);
	// console.log(reserved.length);
	console.log(data);
})