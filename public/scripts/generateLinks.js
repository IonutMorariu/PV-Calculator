const minLat = 36.1;
const maxLat = 43.63;
const minLon = -9.15;
const maxLon = 3.06;
const links = [];
let data = [];
for (let i = minLat; i <= maxLat; i += 0.25) {
	for (let j = minLon; j <= maxLon; j += 0.25) {
		const lon = j.toFixed(2);
		const lat = i.toFixed(2);
		links.push(
			`http://www.adrase.com/adrasemaps/php/monthly_popup.php?lat=${lat}&lon=${lon}&var_tipe=0`
		);
		data.push({
			lat,
			lon
		});
	}
}

const textPromises = links.map(async (link) => {
	const res = await fetch(link, {
		method: 'GET',
		mode: 'no-cors'
	});
	const text = await res.text();
	return text;
});
Promise.all(textPromises).then(function(values) {
	let texts = [];

	values.forEach(function(e, i) {
		if (e.includes('NO HAY DATOS PARA EL PUNTO SELECCIONADO')) {
			texts.push(null);
		} else if (e.includes('Valor medio')) {
			const regex = /[+-]?\d+(\.\d+)?/g;
			const str = e.split('Valor medio')[1].split('tr')[0];
			const floats = str.match(regex).map(function(v) {
				return parseFloat(v);
			});
			texts.push(floats);
		}
	});

	for (let i = 0; i < texts.length; i++) {
		data[i].midValues = texts[i];
	}
	const filteredData = data.filter((dataElement) => {
		return dataElement.midValues != null;
	});
	stringData = JSON.stringify(filteredData);
	console.log(stringData);
});
