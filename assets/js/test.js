var bikes=[{
			"bike_id": "08d68e6e-0668-45e4-b789-34646ee68ca4",
			"lat": 38.9096,
			"lon": -77.04744,
			"vehicle_type": "scooter",
			"is_reserved": 0,
			"is_disabled": 0
			}, {
			"bike_id": "f49552bd-e4b4-4143-b8b1-cb2925ccb592",
			"lat": 38.91451,
			"lon": -77.02171,
			"vehicle_type": "scooter",
			"is_reserved": 0,
			"is_disabled": 0
			}, {
			"bike_id": "9c3e2142-7342-440d-9a9d-97814ee3e922",
			"lat": 38.8922,
			"lon": -77.03215,
			"vehicle_type": "scooter",
			"is_reserved": 0,
			"is_disabled": 0
			}, {
			"bike_id": "23b5848e-c7a5-4d65-972a-097920a23299",
			"lat": 38.91665,
			"lon": -77.03861,
			"vehicle_type": "scooter",
			"is_reserved": 0,
			"is_disabled": 0
			}];

var findList=['23b5848e-c7a5-4d65-972a-097920a23299', '9c3e2142-7342-440d-9a9d-97814ee3e922']
function findBikeByIds(findList, bikeFeaturesList){
	// var bikeFeatures=[]
	var bikeFeatures=findList.map(bikeId=>bikeFeaturesList.find(feature=>feature['bike_id']==bikeId));
	return bikeFeatures;
};

console.log(findBikeByIds(findList, bikes));