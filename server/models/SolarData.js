const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const solarDataSchema = new Schema({
	latitude: {
		type: String,
		required: 'You must supply a latitude'
	},
	longitude: {
		type: String,
		required: 'You must supply a latitude'
	},
	medianValues: [
		{
			type: Number
		}
	]
});

module.exports = mongoose.model('SolarData', solarDataSchema);
