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
	Tc: 25
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
	calcData.placement = await getCoordinates();
	calcData.surfaceInfo = {
		area: area.value,
		slope: slope.value,
		orientation: orientation.value
	};
	const radiationData = await doCalculations(calcData);
	const cellTempProfile = await calculateCellTemp(calcData, radiationData);
	const VocProfile = calculateVoc(cellTempProfile);
	const IscProfile = calculateIsc(radiationData);
	const ImppProfile = calculateImpp(IscProfile);
	const VmppProfile = calculateVmpp(VocProfile);
	const PmppProfile = calculatePmpp(ImppProfile, VmppProfile);
	const PdcProfile = calculateGeneratorPower(PmppProfile);
	const PiProfile = calculatePiProfile(PdcProfile);
	const PoProfile = calculatePoProfile(PiProfile);
	const PacProfile = calculatePacProfile(PoProfile);
	const MonthlyEnergyW = calculateMonthlyEnergy(PacProfile);
	const MonthlyEnergykWh = MonthlyEnergyW.map((val) => val / 1000);
	const AnualEnergyW = calculateAnualEnergy(MonthlyEnergyW);
	const AnualEnergykWh = AnualEnergyW / 1000;

	console.log({
		radiationData,
		PdcProfile,
		PacProfile,
		MonthlyEnergy: { MonthlyEnergyW, MonthlyEnergykWh },
		AnualEnergy: { AnualEnergyW, AnualEnergykWh }
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
	}&area=${calcData.surfaceInfo.area}&orientation=${calcData.surfaceInfo.orientation}`;

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
			const Tc = temp + (Gef * (moduleData.TONC - 20)) / 800; //Cambiar 1000 por la G en el plano inclinado a esa hora
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
		return { VocArray, month: index + 1 };
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

const calculateImpp = (IscProfile) => {
	const ImppProfile = IscProfile.map((IscArray) => {
		const ImppArray = IscArray.map((IscValue) => {
			return IscValue * (moduleData.ImppStar / moduleData.IscStar);
		});
		return ImppArray;
	});
	return ImppProfile;
};

const calculateVmpp = (VocProfile) => {
	console.log(VocProfile);
	const VmppProfile = VocProfile.map(({ VocArray }) => {
		const VmppArray = VocArray.map((VocValue) => {
			return VocValue * (moduleData.VmppStar / moduleData.VocStar);
		});
		return VmppArray;
	});
	return VmppProfile;
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

const calculateMonthlyEnergy = (PacProfile) => {
	return PacProfile.map((PacArray) => {
		return (
			30 *
			PacArray.reduce((total, currentValue) => {
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
