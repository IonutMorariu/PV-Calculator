const path = require('path');
const mongoose = require('mongoose');
const SolarData = mongoose.model('SolarData');
const StationData = mongoose.model('StationData');
const helpers = require('../helpers/helpers');
mongoose.Promise = global.Promise;
const axios = require('axios');

deg2rad = (degs) => {
	return (degs * Math.PI) / 180;
};
rad2deg = (rads) => {
	return (rads * 180) / Math.PI;
};

exports.getData = async (req, res, next) => {
	const latitude = parseFloat(req.query.latitude);
	const longitude = parseFloat(req.query.longitude);
	const location = await SolarData.find({
		location: {
			$near: {
				$maxDistance: 10000,
				$geometry: {
					type: 'Point',
					coordinates: [longitude, latitude]
				}
			}
		}
	});
	const locationData = location[0];
	res.json({ data: locationData });
};
exports.saveData = async (req, res, next) => {
	const data = require('./data.json');
	data.forEach(async (elem) => {
		const data = await new SolarData({
			location: {
				type: 'Point',
				coordinates: [parseFloat(elem.lon), parseFloat(elem.lat)]
			},
			meanValues: elem.midValues
		}).save();
	});
	res.json({ Data: 'Arrived' });
};

exports.doCalculations = async (req, res, next) => {
	if (req.query.longitude == undefined || req.query.latitude == undefined) {
		res.status(400).send('Longitude or latitude is undefined');
	}
	const latitude = parseFloat(req.query.latitude);
	const longitude = parseFloat(req.query.longitude);
	const angle = parseFloat(req.query.angle);
	const applyDirtLevel = req.query.applyDirtLevel;
	const dirtLevel = req.query.dirtLevel;
	const orientation = parseFloat(req.query.orientation);
	const location = await SolarData.find({
		location: {
			$near: {
				$maxDistance: 25000,
				$geometry: {
					type: 'Point',
					coordinates: [longitude, latitude]
				}
			}
		}
	});
	if (location == []) {
		res.status(204);
		res.send('No data found for this location. Please make sure you have entered a valid pair of coordinates');
		return;
	}
	const locationData = location[0];

	const calcData = {
		longitude: locationData.location.coordinates[0],
		latitude: locationData.location.coordinates[1],
		angle,
		orientation,
		applyDirtLevel,
		dirtLevel,
		meanValues: [
			{
				month: 'Jan',
				normalDay: 17,
				meanGR: locationData.meanValues[0]
			},
			{
				month: 'Feb',
				normalDay: 45,
				meanGR: locationData.meanValues[1]
			},
			{
				month: 'Mar',
				normalDay: 74,
				meanGR: locationData.meanValues[2]
			},
			{
				month: 'Apr',
				normalDay: 105,
				meanGR: locationData.meanValues[3]
			},
			{
				month: 'May',
				normalDay: 135,
				meanGR: locationData.meanValues[4]
			},
			{
				month: 'Jun',
				normalDay: 161,
				meanGR: locationData.meanValues[5]
			},
			{
				month: 'Jul',
				normalDay: 199,
				meanGR: locationData.meanValues[6]
			},
			{
				month: 'Aug',
				normalDay: 230,
				meanGR: locationData.meanValues[7]
			},
			{
				month: 'Sep',
				normalDay: 261,
				meanGR: locationData.meanValues[8]
			},
			{
				month: 'Oct',
				normalDay: 292,
				meanGR: locationData.meanValues[9]
			},
			{
				month: 'Nov',
				normalDay: 322,
				meanGR: locationData.meanValues[10]
			},
			{
				month: 'Dic',
				normalDay: 347,
				meanGR: locationData.meanValues[11]
			}
		]
	};

	const resultData = helpers.calculateValues(calcData);

	res.json({ data: resultData });
};

exports.saveStations = async (req, res, next) => {
	const response = await axios(
		'https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/?api_key=' + process.env.AEMET_API
	);
	const data = response.data;
	const datosResponse = await axios(data.datos);
	const estaciones = datosResponse.data;
	const convertedStations = estaciones.map((station) => {
		const latLetter = station.latitud[station.latitud.length - 1];
		const lonLetter = station.longitud[station.longitud.length - 1];
		const latSign = latLetter == 'N' ? 1 : -1;
		const lonSign = lonLetter == 'W' ? -1 : 1;
		const lat = latSign * (parseFloat(station.latitud.substr(0, station.latitud.length - 1)) / 10000);
		const lon = lonSign * (parseFloat(station.longitud.substr(0, station.longitud.length - 1)) / 10000);
		const stationObj = {
			emaId: station.indicativo,
			lat,
			lon
		};
		return stationObj;
	});
	convertedStations.forEach(async (elem) => {
		const data = await new StationData({
			location: {
				type: 'Point',
				coordinates: [elem.lon, elem.lat]
			},
			emaId: elem.emaId
		}).save();
	});
	res.json({ Data: 'Arrived' });
};

exports.getTemperatureProfile = async (req, res, next) => {
	const latitude = parseFloat(req.query.latitude);
	const longitude = parseFloat(req.query.longitude);
	let response;
	const stations = await StationData.find({
		location: {
			$near: {
				$maxDistance: 50000,
				$geometry: {
					type: 'Point',
					coordinates: [longitude, latitude]
				}
			}
		}
	});
	const monthlyValues = [];
	stations.forEach(async (station, index) => {
		const { emaId } = station;
		const aemetLink = `https://opendata.aemet.es/opendata/api/valores/climatologicos/mensualesanuales/datos/anioini/2015/aniofin/2015/estacion/${emaId}/?api_key=${
			process.env.AEMET_API
		}`;
		const firstRes = await axios(aemetLink);
		const firstData = firstRes.data;
		if (firstData.estado == 404) {
			return;
		} else if (firstData.estado == 200) {
			const secondRes = await axios(firstData.datos);
			const secondData = secondRes.data;
			monthlyValues.push(secondData);
		}
		if (index == stations.length - 1) {
			const tempArray = monthlyValues[0].map((month) => {
				const monthNumber = month.fecha.split('-')[1];
				const Tmin = parseFloat(month.tm_min) || 5;
				const Tmax = parseFloat(month.tm_max) || 20;
				return { Tmin, Tmax, monthNumber };
			});
			const normalDays = [17, 45, 74, 105, 135, 161, 199, 230, 261, 292, 322, 347];

			const wp = Math.PI / 4;

			tempArray.pop();

			const tempProfiles = tempArray.map((elem, index) => {
				const { Tmax, Tmin, monthNumber } = elem;
				const Tm = (Tmax + Tmin) / 2;
				const Tr = (Tmax - Tmin) / 2;
				const Ta = [];
				const decl = 23.45 * Math.sin((2 * Math.PI * (normalDays[index] + 284)) / 365);
				const cosWs = -Math.tan(deg2rad(decl)) * Math.tan(deg2rad(latitude));
				const ws = -Math.acos(cosWs);
				for (let h = -12; h < 12; h++) {
					const w = Math.cos(deg2rad(h * 15));
					const a1 = (Math.PI * 12 * (ws - w)) / (21 * Math.PI + 12 * ws);
					const a2 = (Math.PI * (3 * Math.PI - 12 * w)) / (3 * Math.PI - 12 * ws);
					const a3 = (Math.PI * (24 * Math.PI + 12 * (ws - w))) / (21 * Math.PI + 12 * ws);
					const T1 = Tm - Tr * Math.cos(a1);
					const T2 = Tm + Tr * Math.cos(a2);
					const T3 = Tm - Tr * Math.cos(a3);
					if (w <= ws) {
						Ta.push(T1);
					} else if (w > ws && w <= wp) {
						Ta.push(T2);
					} else if (w > wp) {
						Ta.push(T3);
					}
				}
				return { hourlyTa: Ta, monthNumber, Tmax, Tmin };
			});
			response = { latitude, longitude, profiles: tempProfiles };
			if (response) {
				res.json(response);
			} else {
				res.json({ Data: 'Error with data' });
			}
		}
	});
};
