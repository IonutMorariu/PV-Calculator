const deg2rad = (degs) => {
	return (degs * Math.PI) / 180;
};
const rad2deg = (rads) => {
	return (rads * 180) / Math.PI;
};
const data = {
	latitude: 40.29,
	longitude: -3.77,
	medianValues: [
		{
			month: 'Jan',
			normalDay: 17,
			medianGR: 2.1
		},
		{
			month: 'Feb',
			normalDay: 45,
			medianGR: 3.2
		},
		{
			month: 'Mar',
			normalDay: 74,
			medianGR: 4.8
		},
		{
			month: 'Apr',
			normalDay: 105,
			medianGR: 6.0
		},
		{
			month: 'May',
			normalDay: 135,
			medianGR: 7.0
		},
		{
			month: 'Jun',
			normalDay: 161,
			medianGR: 8.0
		},
		{
			month: 'Jul',
			normalDay: 199,
			medianGR: 7.8
		},
		{
			month: 'Aug',
			normalDay: 230,
			medianGR: 6.9
		},
		{
			month: 'Sep',
			normalDay: 261,
			medianGR: 5.3
		},
		{
			month: 'Oct',
			normalDay: 292,
			medianGR: 3.6
		},
		{
			month: 'Nov',
			normalDay: 322,
			medianGR: 2.4
		},
		{
			month: 'Dic',
			normalDay: 347,
			medianGR: 1.8
		}
	]
};
//1. Declinación, excentricidad y angulo amanecer
data.medianValues.forEach((elem, index) => {
	const decl = 23.45 * Math.sin((2 * Math.PI * (elem.normalDay + 284)) / 365);
	const exct = 1 + 0.033 * Math.cos((2 * Math.PI * elem.normalDay) / 365);
	elem.decl = decl;
	elem.exct = exct;
	const cosWs = -Math.tan(deg2rad(decl)) * Math.tan(deg2rad(data.latitude));
	const ws = -Math.acos(cosWs);
	elem.ws = ws;
});
//2. Calculo Bod
data.medianValues.forEach((elem, index) => {
	const Bo = 1.367;
	const cosZenit =
		Math.cos(deg2rad(elem.decl)) *
			Math.cos(deg2rad(elem.exct)) *
			Math.cos(deg2rad(data.latitude)) +
		Math.sin(deg2rad(elem.decl)) * Math.sin(deg2rad(data.latitude));
	const zenit = rad2deg(Math.acos(cosZenit));
	console.log(zenit);
	const Bo0 = Bo * elem.exct * cosZenit;
	const bod =
		-(24 / Math.PI) *
		Bo0 *
		elem.exct *
		(elem.ws * Math.sin(deg2rad(data.latitude)) * Math.sin(deg2rad(elem.decl)) +
			Math.cos(deg2rad(elem.decl)) *
				Math.cos(deg2rad(data.latitude)) *
				Math.sin(elem.ws));
	elem.B0d0 = bod;
});
//3. Calculo del indice de claridad
data.medianValues.forEach((elem, index) => {
	const Ktd = elem.medianGR / elem.B0d0;
	elem.Ktd = Ktd;
});
