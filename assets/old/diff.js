// var a = [['a', 'b'], ['b', 'c']], b = ['b', ['b', 'c'], 'b'], result = [];
var a = ['a', 'b', 'b', 'c'], b = ['b', 'c', 'b', 'd'], result = [];
// _.difference(a, b).forEach(function(t) {result.push(a.indexOf(t))});

// console.log(result);
// var skip_2, skip_3
// var query1='assets/data/skip_2.json'
// var query2='assets/data/skip_3.json'
var urls=['assets/data/skip_2.json', 'assets/data/skip_3.json'];
var results=[];
// fetch('assets/data/skip_2.json').then(response=>{
// 	response.json().then(data=>{
// 		skip_2=data;
// 		console.log(skip_2);
// 	});
// }).then(_=>{
// 	console.log(skip_2);	
// });

// async function getData(queryUrl){
// 	var response=await fetch('assets/data/skip_2.json');
// 	var data=await response.json();
// 	return data;
// };

// getData().then(_=>console.log(skip_2));
// skip_2=getData(query1);
// skip_3=getData(query2);
// console.log(getData(query1));

async function getData(){
	for (var i=0; i<urls.length; i++){
		var response=await fetch(urls[i]);
		var data=await response.json();
		results.push(data['bikes'].map(feature=>[feature['lat'], feature['lon']]));
	};
	console.log(results);
	calcDifference(results[0], results[1]);
	// calcDiff_v4(results[0], results[1]);
};

getData();

function calcDiff_v4(a, b){
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

function calcDifference(a, b){
	for (var i=0; i<b.length; i++){
		var ptComp=b[i]
		var distanceList=a.map(pt=>{
			// console.log(pt);
			return distance(pt[0], pt[1], ptComp[0], ptComp[1])
		});
		var lowest=0;
		// console.log(b);
		// console.log(distanceList);
		for (var j=0; j<distanceList.length; j++){
			// console.log(distanceList[j]);
			// if (distanceList[j]==0){
			// console.log(distanceList[0]);
			if (distanceList[j]<distanceList[lowest]){
				// console.log(distanceList[0])
				// console.log('new low');
				lowest=j;
				// console.log(lowest);
			};
		};
		// console.log(lowest);
		// delete a[lowest];
		if (distanceList[lowest]<100){ //97 is threshold
			a.splice(lowest, 1);	
		};
	};
	// console.log(distanceList);
	console.log(a);
};

function distance(lat1,lon1,lat2,lon2){
	var R=6371; // km
	return Math.acos(Math.sin(lat1)*Math.sin(lat2) + 
	              Math.cos(lat1)*Math.cos(lat2) *
	              Math.cos(lon2-lon1)) * R;
};

function calcDiff(a, b){ //a is old, b is new
	// a.forEach(ele=>delete ele);
	// for (var i=0; i<b.length; i++){
	// 	// if (a[i]==delete a[i];
	// 	delete a[a.indexOf(b[i])];
	// };



	// b.forEach(element=>{
	// 	console.log(element);
	// 	// console.log(element.equals(['b', 'c']));
	// 	console.log(_.isEqual(element, ['b', 'c']));
	// });//delete a[a.indexOf(element)])
	// x=a.filter(element=>element!=null);
	
	// console.log(a.indexOf(['b', 'c']));


	// console.log(a);
	// console.log(a.filter(element=>element!=null));
	// console.log(a.length);
	// console.log(a);
	// console.log(x);

	b.forEach(element=>delete a[a.indexOf(element)])
	return a.filter(element=>element!=null);
};

// console.log(calcDiff(a, b));

function isItemInArray(array, item) {
    for (var i=0; i<array.length; i++) {
        // This if statement depends on the format of your array
        if (array[i][0]==item[0]&&array[i][1]==item[1]) {
            del
        };
    };
    return false;   // Not found
};