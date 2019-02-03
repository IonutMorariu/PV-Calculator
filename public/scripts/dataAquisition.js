const googleEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json?';
const calculationsEndpoint = 'http://142.93.160.157/do-calculations';

const addressInput = document.querySelector('#address');
const cityInput = document.querySelector('#city');
const postalInput = document.querySelector('#postal');
const coordBtn = document.querySelector('#button-get-coords');
const coordsContainer = document.querySelector('#coords-container');
const slope = document.querySelector('#slope');
const area = document.querySelector('#area');
const orientation = document.querySelector('#orientation');

var calcData = {};
const googleApiKey = API_KEYS.GOOGLE_API_KEY;

coordBtn.addEventListener('click', getCalcData);

async function getCalcData() {
	calcData.placement = await getCoordinates();
	calcData.surfaceInfo = {
		area: area.value,
		slope: slope.value,
		orientation: orientation.value
	};
	doCalculations(calcData);
}

const getCoordinates = async () => {
	const address = addressInput.value.split(' ').join('+');
	const city = cityInput.value;
	const postal = postalInput.value;
	const requestURL = `${googleEndpoint}address=${address},${city},${postal},spain&key=${googleApiKey}`;
	console.log(requestURL);
	const response = await fetch(requestURL);
	const data = await response.json();
	console.log(data);
	const info = {
		lat: data.results[0].geometry.location.lat,
		long: data.results[0].geometry.location.lng
	};

	return info;
};

const doCalculations = (calcData) => {
	const requestURL = `${calculationsEndpoint}?latitude=${
		calcData.placement.lat
	}&longitude=${calcData.placement.long}&angle=${
		calcData.surfaceInfo.slope
	}&area=${calcData.surfaceInfo.area}&orientation=${
		calcData.surfaceInfo.orientation
	}`;
	fetch(requestURL)
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
		});
};
