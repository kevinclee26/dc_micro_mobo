d3.json('https://dataviz-du.herokuapp.com/breweries/').then(function(data){
	// console.log(data);
	brewery_count={};
	data.forEach(function(brewery){
		if (brewery['state'] in brewery_count) {
			brewery_count[brewery['state']]+=1;
		} else {
			brewery_count[brewery['state']]=1
		};
	});
	trace={
		type: 'bar', 
		x: Object.keys(brewery_count), 
		y: Object.values(brewery_count)
	}
	Plotly.newPlot('plot', [trace])
	// console.log(brewery_count);
});