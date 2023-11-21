const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const {descriptors, places} = require('./seedHelpers');
mongoose.set('strictQuery', 'false');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'db connection error(seed/index.js)'));
db.once('open', () => {
    console.log('db connecion open.');
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});

    for(let i = 0; i < 250; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 450) + 51;
        const camp = new Campground({
            author: '642f871d225b9923a1794a5d',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam dolor non velit eveniet quaerat impedit quo distinctio! Eaque id exercitationem, consequuntur, facere dolores quaerat nemo esse architecto aperiam, repudiandae perferendis.Qui, ab nam nemo quo alias possimus, blanditiis, eveniet excepturi eaque quas voluptate. Voluptatem voluptate minima dolore sunt? Iusto accusamus voluptatum consequatur harum dolor expedita cupiditate unde enim aliquid nisi?",
            price,
            geometry: { type: 'Point', coordinates: [ cities[random1000].longitude, cities[random1000].latitude ] },
            images: [
                {
                    url: 'https://res.cloudinary.com/dp3woci7k/image/upload/v1681173651/YelpCamp/ueo0viq25q0ninqad1sk.jpg',
                    filename: 'YelpCamp/ueo0viq25q0ninqad1sk',
                  },
                  {
                    url: 'https://res.cloudinary.com/dp3woci7k/image/upload/v1681173654/YelpCamp/cjo4c6engydlnvkfdfcy.png',
                    filename: 'YelpCamp/cjo4c6engydlnvkfdfcy',
                  }
              
            ]
        });
        await camp.save();
    }
    console.log('go on.. check!');
};

seedDB().then(() => {
    mongoose.connection.close()
});