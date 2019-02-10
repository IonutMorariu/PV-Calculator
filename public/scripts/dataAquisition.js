const googleEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json?';
const serverEndpoint = 'http://solar-calc.ionut.cc';

const addressInput = document.querySelector('#address');
const cityInput = document.querySelector('#city');
const postalInput = document.querySelector('#postal');
const coordBtn = document.querySelector('#button-get-coords');
const coordsContainer = document.querySelector('#coords-container');
const slope = document.querySelector('#slope');
const area = document.querySelector('#area');
const orientation = document.querySelector('#orientation');

let calcData = {};
const googleApiKey = API_KEYS.GOOGLE_API_KEY;

coordBtn.addEventListener('click', getCalcData);

const moduleData = {
	VocStar: 57.6,
	IscStar: 4.7,
	VmppStar: 46.08,
	ImppStar: 4.35,
	Ncs: 96,
	Ncp: 1,
	TONC: 47,
	Tc: 25
};

async function getCalcData() {
	calcData.placement = await getCoordinates();
	calcData.surfaceInfo = {
		area: area.value,
		slope: slope.value,
		orientation: orientation.value
	};
	const radiationData = await doCalculations(calcData);
	const cellTempProfile = await calculateCellTemp(calcData, radiationData);
	const VocProfile = cellTempProfile.map(({ TCProfile }, index) => {
		const VocArray = TCProfile.map((temp) => {
			const Voc = moduleData.VocStar + (temp - moduleData.Tc) * (-2.3 / 1000) * moduleData.Ncs;
			return Voc;
		});
		return { VocArray, month: index + 1 };
	});
	console.log({ radiationData, cellTempProfile, VocProfile });
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

const doCalculations = async (calcData) => {
	const requestURL = `${serverEndpoint}/do-calculations?latitude=${calcData.placement.lat}&longitude=${
		calcData.placement.long
	}&angle=${calcData.surfaceInfo.slope}&area=${calcData.surfaceInfo.area}&orientation=${
		calcData.surfaceInfo.orientation
	}`;

	const res = await fetch(requestURL);
	const data = await res.json();
	return data.data;
};

const calculateCellTemp = async (calcData, radiationData) => {
	const requestURL = `${serverEndpoint}/temp-profile?latitude=${calcData.placement.lat}&longitude=${
		calcData.placement.long
	}`;
	const res = await fetch(requestURL);
	const data = await res.json();
	const tempProfiles = data.profiles;
	console.log(tempProfiles);
	const cellTempProfiles = tempProfiles.map(({ hourlyTa, Tmax, Tmin }, index) => {
		const meanValue = radiationData.meanValues[index];
		const TCProfile = hourlyTa.map((temp, index) => {
			const Gef = meanValue.hourlyValues[index].Gtilt * 1000;
			const Tc = temp + (Gef * (moduleData.TONC - 20)) / 800; //Cambiar 1000 por la G en el plano inclinado a esa hora
			return Tc;
		});
		return { TCProfile, month: index + 1, Tmax, Tmin };
	});
	return cellTempProfiles;
};

const calculateVoc = (TCProfile) => {};
