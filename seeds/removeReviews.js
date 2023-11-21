const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');

mongoose.set('strictQuery', 'false');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

// Campground.findByIdAndUpdate(id, {$pull: {reviews: {$in: reviewId}}})
//     .then(() => {
//         console.log('One review deleted');
//     })
//     .catch(e => console.log(e));

Review.deleteMany({rating: 3})
    .then(res => console.log(res))
    .catch(er => console.log(er));