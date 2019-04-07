const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const solarDataSchema = new Schema({
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [
			{
				type: Number,
				required: 'You must supply coordinates!'
			}
		]
	},
	meanValues: [
		{
			type: Number
		}
	]
});

solarDataSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SolarData', solarDataSchema);
