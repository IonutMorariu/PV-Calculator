const deg2rad = (degs) => {
	return (degs * Math.PI) / 180;
};
const rad2deg = (rads) => {
	return (rads * 180) / Math.PI;
};

const cos = (rads) => {
	return Math.cos(rads);
};

const sin = (rads) => {
	return Math.sin(rads);
};
const data = {
	latitude: 40.29,
	longitude: -3.77,
	angle: 30.2,
	orientation: 15.1,
	meanValues: [
		{
			month: 'Jan',
			normalDay: 17,
			meanGR: 2.1
		},
		{
			month: 'Feb',
			normalDay: 45,
			meanGR: 3.2
		},
		{
			month: 'Mar',
			normalDay: 74,
			meanGR: 4.8
		},
		{
			month: 'Apr',
			normalDay: 105,
			meanGR: 6.0
		},
		{
			month: 'May',
			normalDay: 135,
			meanGR: 7.0
		},
		{
			month: 'Jun',
			normalDay: 161,
			meanGR: 8.0
		},
		{
			month: 'Jul',
			normalDay: 199,
			meanGR: 7.8
		},
		{
			month: 'Aug',
			normalDay: 230,
			meanGR: 6.9
		},
		{
			month: 'Sep',
			normalDay: 261,
			meanGR: 5.3
		},
		{
			month: 'Oct',
			normalDay: 292,
			meanGR: 3.6
		},
		{
			month: 'Nov',
			normalDay: 322,
			meanGR: 2.4
		},
		{
			month: 'Dic',
			normalDay: 347,
			meanGR: 1.8
		}
	]
};

const calculateValues = (data) => {
	//1. Declinación, excentricidad y angulo amanecer
	data.meanValues.forEach((elem, index) => {
		const decl = 23.45 * Math.sin((2 * Math.PI * (elem.normalDay + 284)) / 365);
		const exct = 1 + 0.033 * Math.cos((2 * Math.PI * elem.normalDay) / 365);
		elem.decl = decl;
		elem.exct = exct;
		const cosWs = -Math.tan(deg2rad(decl)) * Math.tan(deg2rad(data.latitude));
		const ws = -Math.acos(cosWs);
		elem.ws = ws;
	});
	//2. Calculo Bod
	data.meanValues.forEach((elem, index) => {
		const Bo = 1.367;
		const zenit = [];
		const tilt = [];
		const B00 = [];
		for (let h = -12; h < 12; h++) {
			const cosZenit =
				Math.cos(deg2rad(elem.decl)) *
					Math.cos(deg2rad(h * 15)) *
					Math.cos(deg2rad(data.latitude)) +
				Math.sin(deg2rad(elem.decl)) * Math.sin(deg2rad(data.latitude));
			const zenitVal = rad2deg(Math.acos(cosZenit));
			zenit.push(zenitVal);
		}
		elem.zenit = zenit;

		for (let h = -12; h < 12; h++) {
			const betaRad = deg2rad(data.angle);
			const alphaRad = deg2rad(data.orientation);
			const hRad = deg2rad(h * 15);
			const latRad = deg2rad(data.latitude);
			const declRad = deg2rad(elem.decl);
			const anglIncidenciaVal =
				Math.sign(data.latitude) *
					(Math.sin(betaRad) *
						Math.cos(alphaRad) *
						Math.cos(declRad) *
						Math.cos(hRad) *
						Math.sin(latRad) -
						Math.sin(betaRad) *
							Math.cos(alphaRad) *
							Math.cos(latRad) *
							Math.sin(declRad)) +
				Math.sin(betaRad) *
					Math.sin(alphaRad) *
					Math.cos(declRad) *
					Math.sin(hRad) +
				Math.cos(betaRad) *
					Math.cos(declRad) *
					Math.cos(hRad) *
					Math.cos(latRad) +
				Math.cos(betaRad) * Math.sin(declRad) * Math.sin(latRad);
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
			(elem.ws *
				Math.sin(deg2rad(data.latitude)) *
				Math.sin(deg2rad(elem.decl)) +
				Math.cos(deg2rad(elem.decl)) *
					Math.cos(deg2rad(data.latitude)) *
					Math.sin(elem.ws));
		elem.B0d0 = bod;
	});
	//3. Calculo del indice de claridad y Fd
	data.meanValues.forEach((elem, index) => {
		const Ktd = elem.meanGR / elem.B0d0;
		elem.Ktd = Ktd;
		const Fd = 1 - 1.13 * elem.Ktd;
		elem.Fd = Fd;
	});

	//4. Calculo de Dd y Bd
	data.meanValues.forEach((elem, index) => {
		const Dd0 = elem.Fd * elem.meanGR;
		const Bd0 = elem.meanGR - Dd0;

		elem.Dd0 = Dd0;
		elem.Bd0 = Bd0;
	});

	//5. Calculo de la ecuación de perfil (rd & rg)
	data.meanValues.forEach((elem, index) => {
		const rd = [];
		for (let h = -12; h < 12; h++) {
			const rdval =
				(Math.PI / 24) *
				((Math.cos(deg2rad(h * 15)) - Math.cos(elem.ws)) /
					(elem.ws * Math.cos(elem.ws) - Math.sin(elem.ws)));
			rd.push(rdval);
		}
		const a = 0.409 - 0.5016 * Math.sin(elem.ws + Math.PI / 3);
		const b = 0.6609 + 0.4767 * Math.sin(elem.ws + Math.PI / 3);

		const rg = [];
		let i = 0;
		for (let h = -12; h < 12; h++) {
			const rgval = rd[i] * (a + b * Math.cos(deg2rad(h * 15)));
			rg.push(rgval);
			i++;
		}
		elem.rg = rg;
		elem.rd = rd;
	});

	//6. Calculo de los valores horarios de G,D y B
	data.meanValues.forEach((elem, index) => {
		const hourlyValues = [];
		let hour = -12;
		const dawn = rad2deg(elem.ws) / 15;
		elem.dawn = dawn;
		for (let i = 0; i < 24; i++) {
			const Dh = elem.rd[i] * elem.Dd0;
			const Gh = elem.rg[i] * elem.meanGR;
			const Bh = Gh - Dh;
			hourlyValues.push({
				Bh,
				Dh,
				Gh,
				hour
			});
			hour++;
		}
		elem.hourlyValues = hourlyValues;
	});

	//8. From horizontal plane to tilted plane
	data.meanValues.forEach((elem, index) => {
		for (let i = 0; i < 24; i++) {
			let tiltByZenit = 0;
			const zenitRad = deg2rad(elem.zenit[i]);
			const tiltRad = deg2rad(elem.tilt[i]);
			const betaRad = deg2rad(data.angle);

			const top = Math.max(0, Math.cos(tiltRad));
			const bottom = Math.cos(zenitRad);
			const Btilt = elem.hourlyValues[i].Bh * (top / bottom);
			const k1 = elem.hourlyValues[i].Bh / elem.B00[i];
			const DcTilt = elem.hourlyValues[i].Dh * k1 * (top / bottom);
			const DiTilt =
				elem.hourlyValues[i].Dh * (1 - k1) * ((1 + Math.cos(betaRad)) / 2);
			const Dtilt = DcTilt + DiTilt;
			const Gtilt = Btilt + Dtilt;
			elem.hourlyValues[i] = { ...elem.hourlyValues[i], Btilt, Dtilt, Gtilt };
		}
	});

	//9. Elección de valores clave
	data.meanValues.forEach((elem, index) => {
		const significantValues = [];
		elem.hourlyValues.forEach((value, index) => {
			if (Math.abs(value.hour) < Math.abs(elem.dawn)) {
				significantValues.push(value);
			}
		});
		elem.significantValues = significantValues;
	});

	//9.1 Checking results
	data.meanValues.forEach((elem, index) => {
		let totalGr = 0;
		let totalGtilt = 0;
		elem.significantValues.forEach((value, index) => {
			totalGr += value.Gh;
			totalGtilt += value.Gtilt;
		});
	});
};
