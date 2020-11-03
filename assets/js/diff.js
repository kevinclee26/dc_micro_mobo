var a = ['a', 'b'], b = ['b', 'b', 'c', 'b'], result = [];
// _.difference(a, b).forEach(function(t) {result.push(a.indexOf(t))});

// console.log(result);





function calcDiff(a, b){ //a is old, b is new
	// a.forEach(ele=>delete ele);
	// for (var i=0; i<b.length; i++){
	// 	// if (a[i]==delete a[i];
	// 	delete a[a.indexOf(b[i])];
	// };
	b.forEach(element=>delete a[a.indexOf(element)])
	x=a.filter(element=>element!=null);
	// console.log(a);
	// console.log(a.filter(element=>element!=null));
	// console.log(a.length);
	// console.log(a);
	console.log(x);
};

calcDiff(a, b)