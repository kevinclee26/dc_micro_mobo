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

tempList=[]
async function buildTempTable(){ //can only use await keyword in the context of an async (keyword) function
	var response=await fetch(tempQueryUrl) //await the result of fetch since it is an asynchronous function
	var tempData=await response.json() //await the response
	var tempPanel=document.getElementById('temp');
	var textNode='<p><b>Current Weather: </b></p>';
	Object.entries(tempData['features'][0]['attributes']).forEach(([key, value])=>{
		// temp_panel.append('p').text(`${key.toUpperCase()}: ${value}`); //d3.append is only available to d3
		textNode+=`<p>${key.toUpperCase()}: ${value}</p>`;
	});
	tempPanel.innerHTML=textNode;
	var tempF=tempData['features'][0]['attributes']['AIRTEMP']
	tempList.push(tempF.substring(0, tempF.length-1)) //add to list for chart
	chartTemp(tempList);
};
function chartTemp(tempList){
	var trace={
		type: 'bar', 
		y: tempList
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
	Plotly.newPlot('bar', [trace], layout);
}
buildTempTable().then(response=>console.log('Temperature Loaded')).catch(error=>console.log(error)); //an async functino by definition returns a promise