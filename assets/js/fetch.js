// fetch('https://web.spin.pm/api/gbfs/v1/washington_dc/free_bike_status').then(response=>response['body'].getReader().read().then(data=>console.log(data)));

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

async function buildTempTable(){
	var response=await fetch(tempQueryUrl) //await the result of fetch
	var tempData=await response.json() //await the response
	var tempPanel=document.getElementById('temp');
	var textNode='<p><b>Current Weather: </b></p>';
	Object.entries(tempData['features'][0]['attributes']).forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`);
		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
	});
	tempPanel.innerHTML=textNode;
};

buildTempTable().then(response=>console.log('Temperature Loaded')).catch(error=>console.error(error)); //