const endpoint = 'https://maps.googleapis.com/maps/api/geocode/json?';
const addressInput = document.querySelector('#address');
const cityInput = document.querySelector('#city');
const postalInput = document.querySelector('#postal');
const coordBtn = document.querySelector('#button-get-coords');
const coordsContainer = document.querySelector('#coords-container');
var calcData = {};
const googleApiKey = API_KEYS.GOOGLE_API_KEY;

coordBtn.addEventListener('click', getCalcData);

function getCalcData() {
	console.log('Working');
	calcData.placement = getCoordinates();
	console.log(calcData);
}

function getCoordinates() {
	const address = addressInput.value.split(' ').join('+');
	const city = cityInput.value;
	const postal = postalInput.value;
	const requestURL = `${endpoint}address=${address},${city},${postal},spain&key=${googleApiKey}`;
	var info = {};
	fetch(requestURL)
		.then(res => res.json())
		.then(data => {
			info.lat = data.results[0].geometry.location.lat;
			info.long = data.results[0].geometry.location.lng;
		});
	return info;
}
