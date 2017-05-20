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
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supple an author'
	}
}, {
	toJSON: { virtuals: true},
	toObject: { virtuals: true},
});

// define our indexes
storeSchema.index({
	name: 'text',
	description: 'text'
});

storeSchema.index({
	location: '2dsphere'
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

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		// lookup stores and populate their reviews
		{ $lookup:
			{
				from: 'reviews', // Review model - mongodb lowercases it and adds 's' to the end
				localField: '_id', // which field on the store?
				foreignField: 'store', // which field on the review?
				as: 'reviews' // saved to the store as property with name of reviews
			}
		},
		// filter for only items that have 2 or more reviews
		{ $match:
			{ 'reviews.1': // reviews.1 is the mongodb equivalent to reviews[1] in js. So only match when reviews has at least 2 items
				{ $exists: true }
			}
		},
		// add the average reviews field
		{ $project: { // $addField preferrable, but not available in mongodb version 3.2.x
			averageRating: { $avg: '$reviews.rating'},
			slug: '$$ROOT.slug',
			photo: '$$ROOT.photo',
			name: '$$ROOT.name',
			reviews: '$$ROOT.reviews',
		}},
		// sort it by our new field, highest reviews first
		{ $sort: { averageRating: -1 }},
		// limit to at most 10
		{ $limit: 10 }
	])
};

// find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
	ref: 'Review', // what model to link?
	localField: '_id', // which field on the store?
	foreignField: 'store' // which field on the review?
});

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);