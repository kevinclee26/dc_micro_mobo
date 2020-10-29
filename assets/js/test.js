const proxyurl = "https://cors-anywhere.herokuapp.com/";
var compQueryUrl='https://us-central1-waybots-production.cloudfunctions.net/ddotApi-dcFreeBikeStatus';

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
fetch(proxyurl+compQueryUrl).then(response=>response.text()).then(contents=>console.log(contents)).catch(error=>console.error);