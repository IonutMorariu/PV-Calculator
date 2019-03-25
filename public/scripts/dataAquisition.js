const googleEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json?';
const serverEndpoint = 'https://solar-calc.ionut.cc';

const addressInput = document.querySelector('#address');
const cityInput = document.querySelector('#city');
const postalInput = document.querySelector('#postal');
const coordBtn = document.querySelector('#button-get-coords');
const coordsContainer = document.querySelector('#coords-container');
const slope = document.querySelector('#slope');
const area = document.querySelector('#area');
const orientation = document.querySelector('#orientation');
const dirtLevel = document.querySelector('#dirt-level');
const applyDirt = document.querySelector('#apply-dirt');
const tableBody = document.querySelector('#radiation-data');

let calcData = {};
const googleApiKey = API_KEYS.GOOGLE_API_KEY;

coordBtn.addEventListener('click', getCalcData);

const moduleData = {
	Gstar: 1000,
	VocStar: 57.6,
	IscStar: 4.7,
	VmppStar: 46.08,
	ImppStar: 4.35,
	Ncs: 96,
	Ncp: 1,
	TONC: 47,
	Tc: 25,
	Vt: 0.025,
	m: 1.3
};

const generatordata = {
	seriesModules: 12,
	parallelModules: 11
};

const inverterData = {
	k0: 0.01,
	k1: 0.025,
	k2: 0.05,
	power: 25000,
	vMin: 420,
	vMax: 750
};

async function getCalcData() {
	tableBody.innerHTML = 'Loading...';

	calcData.placement = await getCoordinates();

	calcData.surfaceInfo = {
		area: area.value,
		slope: slope.value,
		orientation: orientation.value,
		dirtLevel: dirtLevel.value,
		applyDirt: applyDirt.checked // true
	};
	const radiationData = await doCalculations(calcData);
	const cellTempProfile = await calculateCellTemp(calcData, radiationData);
	console.log(cellTempProfile);
	const VocProfile = calculateVoc(cellTempProfile);
	const IscProfile = calculateIsc(radiationData);
	const { VmppProfile, ImppProfile, RsStar, rs, koc, DM0, DM, impp, vmpp } = applyVariableFF(VocProfile, IscProfile, cellTempProfile);
	const PmppProfile = calculatePmpp(ImppProfile, VmppProfile);
	const PdcProfile = calculateGeneratorPower(PmppProfile);
	const PiProfile = calculatePiProfile(PdcProfile);
	const PoProfile = calculatePoProfile(PiProfile);
	const PacProfile = calculatePacProfile(PoProfile);
	const MonthlyEac = calculateMonthlyEac(PacProfile);
	const MonthlyEdc = calculateMonthlyEdc(PdcProfile);
	const Yf = MonthlyEac.map((val) => val / (moduleData.VmppStar * moduleData.ImppStar * 12 * 11));
	const MonthlyEnergykWh = MonthlyEac.map((val) => val / 1000);
	const AnualEnergyW = calculateAnualEnergy(MonthlyEac);
	const AnualEnergykWh = AnualEnergyW / 1000;

	// createTable(radiationData, MonthlyEac, MonthlyEdc, Yf, tableBody);

	console.log({
		radiationData,
		PdcProfile,
		PacProfile,
		MppValues: { VmppProfile, ImppProfile },
		VocProfile,
		IscProfile,
		cellTempProfile,
		IscProfile,
		variableFF: { RsStar, rs, koc, DM0, DM, impp, vmpp }
	});
}

const getCoordinates = async () => {
	const address = addressInput.value.split(' ').join('+');
	const city = cityInput.value;
	const postal = postalInput.value;
	const requestURL = `${googleEndpoint}address=${address},${city},${postal},spain&key=${googleApiKey}`;
	const response = await fetch(requestURL);
	const data = await response.json();
	const info = {
		lat: data.results[0].geometry.location.lat,
		long: data.results[0].geometry.location.lng
	};

	return info;
};

const doCalculations = async (calcData) => {
	const requestURL = `${serverEndpoint}/do-calculations?latitude=${calcData.placement.lat}&longitude=${calcData.placement.long}&angle=${
		calcData.surfaceInfo.slope
	}&area=${calcData.surfaceInfo.area}&orientation=${calcData.surfaceInfo.orientation}&applyDirtLevel=${
		calcData.surfaceInfo.applyDirt
	}&dirtLevel=${calcData.surfaceInfo.dirtLevel}`;

	const res = await fetch(requestURL);
	const data = await res.json();
	return data.data;
};

const calculateCellTemp = async (calcData, radiationData) => {
	const requestURL = `${serverEndpoint}/temp-profile?latitude=${calcData.placement.lat}&longitude=${calcData.placement.long}`;
	const res = await fetch(requestURL);
	const data = await res.json();
	const tempProfiles = data.profiles;
	const cellTempProfiles = tempProfiles.map(({ hourlyTa, Tmax, Tmin }, index) => {
		const meanValue = radiationData.meanValues[index];
		const TCProfile = hourlyTa.map((temp, index) => {
			const Gef = meanValue.hourlyValues[index].Gtilt * 1000;
			const Tc = 25 + (Gef * (moduleData.TONC - 20)) / 800; //Cambiar 1000 por la G en el plano inclinado a esa hora
			return Tc;
		});
		return { TCProfile, month: index + 1, Tmax, Tmin };
	});
	return cellTempProfiles;
};

const calculateVoc = (cellTempProfile) => {
	const VocProfile = cellTempProfile.map(({ TCProfile }, index) => {
		const VocArray = TCProfile.map((temp) => {
			const Voc = moduleData.VocStar + (temp - moduleData.Tc) * (-2.3 / 1000) * moduleData.Ncs;
			return Voc;
		});
		return VocArray;
	});
	return VocProfile;
};

const calculateIsc = (radiationData) => {
	const IscProfile = radiationData.meanValues.map(({ hourlyValues }) => {
		const IscArray = hourlyValues.map(({ Gtilt }) => {
			const IscValue = Gtilt * 1000 * (moduleData.IscStar / moduleData.Gstar);
			return IscValue;
		});
		return IscArray;
	});
	return IscProfile;
};

const applyVariableFF = (VocProfile, IscProfile, cellTempProfile) => {
	const Vtn = (moduleData.Vt * (273 + 25)) / 300;
	const RsStar =
		(moduleData.VocStar / moduleData.Ncs -
			moduleData.VmppStar / moduleData.Ncs +
			moduleData.m * Vtn * Math.log(1 - moduleData.ImppStar / moduleData.IscStar)) /
		(moduleData.ImppStar / moduleData.Ncp);

	const rs = VocProfile.map((VocArray, arrIndex) => {
		return VocArray.map((VocValue, valIndex) => {
			return RsStar * ((moduleData.Ncs / moduleData.Ncp) * (IscProfile[arrIndex][valIndex] / VocValue));
		});
	});
	const koc = VocProfile.map((VocArray, arrIndex) => {
		return VocArray.map((VocValue, valIndex) => {
			return VocValue / moduleData.Ncs / (moduleData.m * ((moduleData.Vt * (cellTempProfile[arrIndex].TCProfile[valIndex] + 273)) / 300));
		});
	});
	const DM0 = koc.map((kocArray, arrIndex) => {
		return kocArray.map((kocValue, valIndex) => {
			return (kocValue - 1) / (kocValue - Math.log(kocValue));
		});
	});
	const DM = DM0.map((DM0Array, arrIndex) => {
		return DM0Array.map((DM0Value, valIndex) => {
			return DM0Value + 2 * rs[arrIndex][valIndex] * Math.pow(DM0Value, 2);
		});
	});

	const impp = DM.map((DMArray, arrIndex) => {
		return DMArray.map((DMValue, valIndex) => {
			return 1 - DMValue / koc[arrIndex][valIndex];
		});
	});

	const vmpp = impp.map((imppArray, arrIndex) => {
		return imppArray.map((imppValue, valIndex) => {
			return 1 - Math.log(koc[arrIndex][valIndex] / DM[arrIndex][valIndex]) / koc[arrIndex][valIndex] - rs[arrIndex][valIndex] * imppValue;
		});
	});

	const Vmpp = vmpp.map((vmppArray, arrIndex) => {
		return vmppArray.map((vmppValue, valIndex) => {
			return vmppValue * VocProfile[arrIndex][valIndex];
		});
	});
	const Impp = impp.map((imppArray, arrIndex) => {
		return imppArray.map((imppValue, valIndex) => {
			return imppValue * IscProfile[arrIndex][valIndex];
		});
	});

	return { VmppProfile: Vmpp, ImppProfile: Impp, RsStar, rs, koc, DM0, DM, impp, vmpp };
};

const calculatePmpp = (ImppProfile, VmppProfile) => {
	const PmppProfile = ImppProfile.map((ImppArray, dayIndex) => {
		const PmppArray = ImppArray.map((ImppValue, hourIndex) => {
			return ImppValue * VmppProfile[dayIndex][hourIndex];
		});
		return PmppArray;
	});
	return PmppProfile;
};

const calculateGeneratorPower = (PmppProfile) => {
	const PdcProfile = PmppProfile.map((PmppArray) => {
		return PmppArray.map((PmppValue) => {
			return PmppValue * generatordata.seriesModules * generatordata.parallelModules;
		});
	});
	return PdcProfile;
};

const calculatePiProfile = (PdcProfile) => {
	return PdcProfile.map((PdcArray) => {
		return PdcArray.map((PdcValue) => {
			return PdcValue / inverterData.power;
		});
	});
};

const calculatePoProfile = (PiProfile) => {
	return PiProfile.map((PiArray) => {
		return PiArray.map((PiValue) => {
			if (PiValue <= 0) {
				return 0;
			}
			const a = inverterData.k2;
			const b = inverterData.k1 + 1;
			const c = inverterData.k0 - PiValue;
			const firstSolution = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
			const secondSolution = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
			return firstSolution > 0 ? firstSolution : secondSolution;
		});
	});
};

const calculatePacProfile = (PoProfile) => {
	return PoProfile.map((PoArray) => {
		return PoArray.map((PoValue) => {
			return PoValue * inverterData.power;
		});
	});
};

const calculateMonthlyEac = (PacProfile) => {
	return PacProfile.map((PacArray) => {
		return (
			30 *
			PacArray.reduce((total, currentValue) => {
				return total + (currentValue > 0 ? currentValue : 0);
				EacCell.textContent = MonthlyEac[index];
			}, 0)
		);
	});
};

const calculateMonthlyEdc = (PdcProfile) => {
	return PdcProfile.map((PdcArray) => {
		return (
			30 *
			PdcArray.reduce((total, currentValue) => {
				return total + (currentValue > 0 ? currentValue : 0);
			}, 0)
		);
	});
};

const calculateAnualEnergy = (MonthlyEnergy) => {
	return MonthlyEnergy.reduce((total, currentValue) => {
		return total + (currentValue > 0 ? currentValue : 0);
	}, 0);
};

const createTable = (radiationData, MonthlyEac, MonthlyEdc, Yf, tableBody) => {
	tableBody.innerHTML = '';
	const { meanValues } = radiationData;

	meanValues.forEach((value, index) => {
		const row = document.createElement('tr');
		let Gefd = 0;
		let Defd = 0;
		let Befd = 0;

		value.hourlyValues.forEach((hValue) => {
			Gefd += hValue.Gtilt;
			Defd += hValue.Dtilt;
			Befd += hValue.Btilt;
		});
		const G0dCell = document.createElement('td');
		G0dCell.textContent = value.meanGR;
		const Bd0Cell = document.createElement('td');
		Bd0Cell.textContent = value.Dd0;
		const Dd0dCell = document.createElement('td');
		Dd0dCell.textContent = value.Bd0;
		const GefdCell = document.createElement('td');
		GefdCell.textContent = Gefd;
		const DefdCell = document.createElement('td');
		DefdCell.textContent = Defd;
		const BefdCell = document.createElement('td');
		BefdCell.textContent = Befd;
		const monthCell = document.createElement('td');
		monthCell.textContent = index + 1;
		const EacCell = document.createElement('td');
		EacCell.textContent = MonthlyEac[index] / 1000;
		const EdcCell = document.createElement('td');
		EdcCell.textContent = MonthlyEdc[index] / 1000;
		const YfCell = document.createElement('td');
		YfCell.textContent = Yf[index];
		row.appendChild(monthCell);
		row.appendChild(G0dCell);
		row.appendChild(Bd0Cell);
		row.appendChild(Dd0dCell);
		row.appendChild(GefdCell);
		row.appendChild(DefdCell);
		row.appendChild(BefdCell);
		row.appendChild(EacCell);
		row.appendChild(EdcCell);
		row.appendChild(YfCell);
		tableBody.appendChild(row);
	});
};
