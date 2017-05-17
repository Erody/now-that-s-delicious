const mongoose = require('mongoose');
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name!'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
			type: Number,
			required: 'You must supply coordinates!'
		}],
		address: {
			type: String,
			required: 'You must supply an address!'
		}
	},
	photo: String
});

storeSchema.pre('save', async function(next) {
	if(!this.isModified('name')) {
		return next(); // skip it, stop this function from running
	}
	this.slug = slug(this.name);
	// find other stores with this slug
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx});
	if(storesWithSlug.length) {
		// replace slug with slug-x where x is the number of storesWithSlug +1. This ensures a unique slug
		this.slug = `${this.slug}-${storesWithSlug.length+1}`
	}
	next();
});

storeSchema.statics.getTagsList = function() {
	return this.aggregate([
		{ $unwind: '$tags'},
		{ $group: { _id: '$tags', count: { $sum: 1}}},
		{ $sort: { count: -1 }}
	]);
};

module.exports = mongoose.model('Store', storeSchema);