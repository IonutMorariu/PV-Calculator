deg2rad = (degs) => {
	return (degs * Math.PI) / 180;
};
rad2deg = (rads) => {
	return (rads * 180) / Math.PI;
};

const cos = (rads) => {
	return Math.cos(rads);
};

const sin = (rads) => {
	return Math.sin(rads);
};
exports.calculateValues = (data) => {
	const newData = data;
	//1. Declinación, excentricidad y angulo amanecer
	newData.meanValues.forEach((elem, index) => {
		const decl = 23.45 * Math.sin((2 * Math.PI * (elem.normalDay + 284)) / 365);
		const exct = 1 + 0.033 * Math.cos((2 * Math.PI * elem.normalDay) / 365);
		elem.decl = decl;
		elem.exct = exct;
		const cosWs = -Math.tan(deg2rad(decl)) * Math.tan(deg2rad(newData.latitude));
		const ws = -Math.acos(cosWs);
		elem.ws = ws;
	});
	//2. Calculo Bod
	newData.meanValues.forEach((elem, index) => {
		const Bo = 1.367;
		const zenit = [];
		const tilt = [];
		const B00 = [];
		for (let h = -12; h < 12; h++) {
			const cosZenit =
				Math.cos(deg2rad(elem.decl)) * Math.cos(deg2rad(h * 15)) * Math.cos(deg2rad(newData.latitude)) +
				Math.sin(deg2rad(elem.decl)) * Math.sin(deg2rad(newData.latitude));
			const zenitVal = rad2deg(Math.acos(cosZenit));
			zenit.push(zenitVal);
		}
		elem.zenit = zenit;
		for (let h = -12; h < 12; h++) {
			const betaRad = deg2rad(newData.angle);
			const alphaRad = deg2rad(newData.orientation);
			const hRad = deg2rad(h * 15);
			const latRad = deg2rad(newData.latitude);
			const declRad = deg2rad(elem.decl);
			const anglIncidenciaVal =
				Math.sign(newData.latitude) *
					(Math.sin(betaRad) * Math.cos(alphaRad) * Math.cos(declRad) * Math.cos(hRad) * Math.sin(latRad) -
						Math.sin(betaRad) * Math.cos(alphaRad) * Math.cos(latRad) * Math.sin(declRad)) +
				Math.sin(betaRad) * Math.sin(alphaRad) * Math.cos(declRad) * Math.sin(hRad) +
				Math.cos(betaRad) * Math.cos(declRad) * Math.cos(hRad) * Math.cos(latRad) +
				Math.cos(betaRad) * Math.sin(declRad) * Math.sin(latRad);
			console.log({
				data: { angle: newData.angle, orientation: newData.orientation, lat: newData.latitude, decl: elem.decl },
				h,
				anglIncidenciaVal,
				mes: index
			});
			const anglIncidencia = rad2deg(Math.acos(anglIncidenciaVal));
			tilt.push(anglIncidencia);
			elem.tilt = tilt;
		}

		for (let h = 0; h < 24; h++) {
			const B00val = Bo * elem.exct * Math.cos(deg2rad(elem.zenit[h]));
			B00.push(B00val);
		} //TODO: Grados o radianes?
		elem.B00 = B00;

		const bod =
			-(24 / Math.PI) *
			Bo *
			elem.exct *
			(elem.ws * Math.sin(deg2rad(newData.latitude)) * Math.sin(deg2rad(elem.decl)) +
				Math.cos(deg2rad(elem.decl)) * Math.cos(deg2rad(newData.latitude)) * Math.sin(elem.ws));
		elem.B0d0 = bod;
	});
	//3. Calculo del indice de claridad y Fd
	newData.meanValues.forEach((elem, index) => {
		const Ktd = elem.meanGR / elem.B0d0;
		elem.Ktd = Ktd;
		const Fd = 1 - 1.13 * elem.Ktd;
		elem.Fd = Fd;
	});

	//4. Calculo de Dd y Bd
	newData.meanValues.forEach((elem, index) => {
		const Dd0 = elem.Fd * elem.meanGR;
		const Bd0 = elem.meanGR - Dd0;

		elem.Dd0 = Dd0;
		elem.Bd0 = Bd0;
	});

	//5. Calculo de la ecuación de perfil (rd & rg)
	newData.meanValues.forEach((elem, index) => {
		const rd = [];
		for (let h = -12; h < 12; h++) {
			const hRad = Math.cos(deg2rad(h * 15));
			const rdval = (Math.PI / 24) * ((hRad - Math.cos(elem.ws)) / (elem.ws * Math.cos(elem.ws) - Math.sin(elem.ws)));
			rd.push(rdval);
		}
		const a = 0.409 - 0.5016 * Math.sin(elem.ws + Math.PI / 3);
		const b = 0.6609 + 0.4767 * Math.sin(elem.ws + Math.PI / 3);

		const rg = [];
		let i = 0;
		for (let h = -12; h < 12; h++) {
			const hRad = Math.cos(deg2rad(h * 15));
			const rgval = rd[i] * (a + b * hRad);
			rg.push(rgval);
			i++;
		}
		elem.rg = rg;
		elem.rd = rd;
	});

	//6. Calculo de los valores horarios de G,D y B
	newData.meanValues.forEach((elem, index) => {
		const hourlyValues = [];
		let hour = -12;
		const dawn = rad2deg(elem.ws) / 15;
		elem.dawn = dawn;
		for (let i = 0; i < 24; i++) {
			const cosHour = Math.cos(deg2rad(hour * 15));
			const cosWs = Math.cos(elem.ws);
			if (cosHour > cosWs) {
				const Dh = elem.rd[i] * elem.Dd0;
				const Gh = elem.rg[i] * elem.meanGR;
				const Bh = Gh - Dh;
				hourlyValues.push({
					Bh,
					Dh,
					Gh,
					cosHour,
					cosWs
				});
			} else {
				hourlyValues.push({
					Bh: 0,
					Dh: 0,
					Gh: 0,
					cosHour,
					cosWs
				});
			}
			hour++;
		}
		elem.hourlyValues = hourlyValues;
	});

	//8. From horizontal plane to tilted plane
	newData.meanValues.forEach((elem, index) => {
		for (let i = 0; i < 24; i++) {
			const zenitRad = deg2rad(elem.zenit[i]);
			const tiltRad = deg2rad(elem.tilt[i]);
			const betaRad = deg2rad(newData.angle);

			const numerator = Math.max(0, Math.cos(tiltRad));
			const denominator = Math.cos(zenitRad);
			const Btilt = elem.hourlyValues[i].Bh * (numerator / denominator);
			const k1 = elem.hourlyValues[i].Bh / elem.B00[i];
			const DcTilt = elem.hourlyValues[i].Dh * k1 * (numerator / denominator);
			const DiTilt = elem.hourlyValues[i].Dh * (1 - k1) * ((1 + Math.cos(betaRad)) / 2);
			const Dtilt = DcTilt + DiTilt;
			const Gtilt = Btilt + Dtilt;
			elem.hourlyValues[i] = { ...elem.hourlyValues[i], Btilt, Dtilt, DcTilt, DiTilt, Gtilt };
		}
	});
	newData.applyDirtLevel = true;

	if (newData.applyDirtLevel === true) {
		newData.meanValues.forEach((elem, index) => {
			for (let i = 0; i < 24; i++) {
				const tiltRad = deg2rad(elem.tilt[i]);
				const betaRad = deg2rad(newData.angle);
				let TDirtTClean = 0;
				let ar = 0;
				let c1 = 4 / (3 * Math.PI);
				let c2 = 0;
				switch (newData.dirtLevel) {
					case 'CLEAN':
						TDirtTClean = 1;
						ar = 0.17;
						c2 = -0.069;
						break;
					case 'LOW':
						TDirtTClean = 0.98;
						ar = 0.2;
						c2 = -0.054;
						break;
					case 'MID':
						TDirtTClean = 0.97;
						ar = 0.21;
						c2 = -0.049;
						break;
					case 'HIGH':
						TDirtTClean = 0.92;
						ar = 0.27;
						c2 = -0.023;
					default:
						TDirtTClean = 0;
						ar = 0;
						c2 = 0;
				}
				newData.TDirtTClean = TDirtTClean;
				newData.ar = ar;
				newData.c1 = c1;
				newData.c2 = c2;
				const FTB = (Math.exp(-Math.cos(tiltRad) / ar) - Math.exp(-1 / ar)) / (1 - Math.exp(-1 / ar));
				const expFTD =
					-(1 / ar) *
					(c1 * (Math.sin(betaRad) + (Math.PI - betaRad - Math.sin(betaRad)) / (1 + Math.cos(betaRad))) +
						c2 * Math.pow(Math.sin(betaRad) + (Math.PI - betaRad - Math.sin(betaRad)) / (1 + Math.cos(betaRad)), 2));
				const FTD = Math.exp(expFTD);

				const Btilt = elem.hourlyValues[i].Btilt * TDirtTClean * (1 - FTB);
				const DiTilt = elem.hourlyValues[i].DiTilt * TDirtTClean * (1 - FTD);
				const DcTilt = elem.hourlyValues[i].DcTilt * TDirtTClean * (1 - FTB);
				const Dtilt = DiTilt + DcTilt;
				const Gtilt = Dtilt + Btilt;

				//Overwrite data with new values
				elem.hourlyValues[i].Btilt = Btilt;
				elem.hourlyValues[i].DiTilt = DiTilt;
				elem.hourlyValues[i].DcTilt = DcTilt;
				elem.hourlyValues[i].Dtilt = Dtilt;
				elem.hourlyValues[i].Gtilt = Gtilt;
			}
		});
	}
	//9. Elección de valores clave
	newData.meanValues.forEach((elem, index) => {
		const significantValues = [];
		elem.hourlyValues.forEach((value, index) => {
			if (Math.abs(value.hour) < Math.abs(elem.dawn)) {
				significantValues.push(value);
			}
		});
		elem.significantValues = significantValues;
	});

	//9.1 Checking results
	newData.meanValues.forEach((elem, index) => {
		let totalGr = 0;
		let totalGtilt = 0;
		elem.significantValues.forEach((value, index) => {
			totalGr += value.Gh;
			totalGtilt += value.Gtilt;
		});
	});

	return newData;
};
