const express = require('express');
const router = express.Router();

const dataController = require('../controllers/dataController');

// Do work here
router.get('/', (req, res) => {
	res.send('Get your solar data from /solar-data');
});

router.get('/solar-data', dataController.getData);

//router.get('/save-solar-data', dataController.saveData);
//This route is used to save the solar data to the db from the json file (Only do once)

//router.get('/save-stations', dataController.saveStations);
// This route is used to save the EMA ID of stations in Spain by coordinates from the AEMET OpenData API
// (In case API fails & to not abuse their API) (Only do once)

router.get('/do-calculations', dataController.doCalculations);

router.get('/temp-profile', dataController.getTemperatureProfile);

module.exports = router;
