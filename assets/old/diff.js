var a = [['a', 'b'], ['b', 'c']], b = ['b', ['b', 'c'], 'b'], result = [];
// _.difference(a, b).forEach(function(t) {result.push(a.indexOf(t))});

// console.log(result);





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
	
	console.log(a.indexOf(['b', 'c']));


	// console.log(a);
	// console.log(a.filter(element=>element!=null));
	// console.log(a.length);
	// console.log(a);
	// console.log(x);

	// b.forEach(element=>delete a[a.indexOf(element)])
	// return a.filter(element=>element!=null);
};

calcDiff(a, b)

function isItemInArray(array, item) {
    for (var i=0; i<array.length; i++) {
        // This if statement depends on the format of your array
        if (array[i][0]==item[0]&&array[i][1]==item[1]) {
            del
        };
    };
    return false;   // Not found
};