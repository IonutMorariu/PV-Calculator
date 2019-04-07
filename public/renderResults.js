const results = JSON.parse(localStorage['results'])
console.log(results)
//Placement data
$('#area').innerHTML = results.placementData.area + ' m<sup>2</sup>'
$('#latitude').textContent = results.placementData.location.lat.toFixed(2)
$('#longitude').textContent = results.placementData.location.long.toFixed(2)
$('#orientation').textContent = results.placementData.orientation + ' º'
$('#slope').textContent = results.placementData.slope + ' º'
$('#global-radiation').innerHTML =
	(
		results.radiationData.meanValues.reduce((prev, next) => {
			return (prev += next.meanGR)
		}, 0) / 12
	).toFixed(2) + ' kWh/m<sup>2</sup>'

//Calculation data

$('#installed-modules').textContent = results.calculationsData.installedModules
$('#installed-power').textContent = results.calculationsData.installedPower + ' W'
$('#inverter-power').textContent = results.calculationsData.inverterPower + ' W'
$('#anual-energy').textContent =
	((results.calculationsData.AnualEnergykWh / 1000) * results.calculationsData.areaRelation).toFixed(2) + ' MWh'

const ctx1 = document.getElementById('chart-1').getContext('2d')
const ctx2 = document.getElementById('chart-2').getContext('2d')
const ctx3 = document.getElementById('chart-3').getContext('2d')

const myChart1 = new Chart(ctx1, {
	type: 'line',
	data: {
		labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		datasets: [
			{
				label: 'Energia mensual en kWh',
				data: results.calculationsData.MonthlyEnergykWh.map(val => (val * results.calculationsData.areaRelation).toFixed(2)),
				backgroundColor: ['#ff76751f'],
				borderColor: ['#ff7675'],
				lineTension: 0,
			},
		],
	},
	options: {
		responsive: true,
		scales: {
			yAxes: [
				{
					ticks: {
						beginAtZero: true,
					},
				},
			],
		},
	},
})
const myChart2 = new Chart(ctx2, {
	type: 'line',
	data: {
		labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		datasets: [
			{
				label: 'Productividad diaria media',
				data: results.calculationsData.monthlyYf.map(val => (val / 30).toFixed(2)),
				backgroundColor: ['#0984e31f'],
				borderColor: ['#0984e3'],
				lineTension: 0,
			},
		],
	},
	options: {
		responsive: true,
		scales: {
			yAxes: [
				{
					ticks: {
						beginAtZero: true,
					},
				},
			],
		},
	},
})
console.log(results.calculationsData.PacProfile.map(profile => Math.max(...profile)))
const myChart3 = new Chart(ctx3, {
	type: 'line',
	data: {
		labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
		datasets: [
			{
				label: 'Potencia Máxima diaria en W',
				data: results.calculationsData.PacProfile.map(profile => (Math.max(...profile) * results.calculationsData.areaRelation).toFixed(2)),
				backgroundColor: ['#00b8941f'],
				borderColor: ['#00b894'],
				lineTension: 0,
			},
		],
	},
	options: {
		responsive: true,
		scales: {
			yAxes: [
				{
					ticks: {
						beginAtZero: true,
					},
				},
			],
		},
	},
})
