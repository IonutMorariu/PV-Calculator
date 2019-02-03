const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const stationDataSchema = new Schema({
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
	emaId: {
		type: String
	}
});

stationDataSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('StationData', stationDataSchema);
