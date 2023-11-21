const Campground = require('../models/campground');
const {cloudinary} = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    const camp = new Campground(req.body.campground);
    camp.geometry = geoData.body.features[0].geometry;
    camp.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    if(camp.images.length === 0)
        camp.images.push({
            url: "https://res.cloudinary.com/dp3woci7k/image/upload/v1681093643/YelpCamp/camp-img.jpg",
            filename: 'YelpCamp/camp-img'
        });
    camp.author = req.user._id;
    await camp.save();
    req.flash("success", "successfully made a new campground!");
    res.redirect(`/campgrounds/${camp._id}`);
}

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!campground) {
        req.flash('error', 'Cannot find the campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground});
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', {campground});
}

module.exports.updateCampground = async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    // adding new images
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    campground.images.push(...imgs);
    // removing images
    if(req.body.deleteImages) {
        for(filename of req.body.deleteImages)
            await cloudinary.uploader.destroy(filename);
        await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}});
    }    
    if(campground.images.length === 0)
        campground.images.push({
            url: "https://res.cloudinary.com/dp3woci7k/image/upload/v1681093643/YelpCamp/camp-img.jpg",
            filename: 'YelpCamp/camp-img'
        });
    await campground.save();
    if(!campground) {
        req.flash('error', 'Cannot find the campground!');
        return res.redirect('/campgrounds');
    }
    req.flash('success', 'successfully updated the campground!');
    res.redirect(`/campgrounds/${id}`);
}

module.exports.deleteCampground = async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'removed your campground!')
    res.redirect('/campgrounds');
}