if(process.env.NODE_ENV !== 'production')
    require('dotenv').config();

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// routes
const campgroundsRoutes = require("./routes/campgrounds");
const reviewsRoutes = require("./routes/reviews");
const session = require("express-session");
const flash = require("connect-flash");
const userRoutes = require("./routes/users");
const MongoDBStore = require('connect-mongo')(session);


// establishing mongoose connection
mongoose.set('strictQuery', 'false');


mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error encountered during database connection'));
db.once('open', () => {
    console.log('Database(yelp-camp) Connection Successfull!');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = new MongoDBStore ({
    url: dbUrl,
    secret,
    touchAfter: 24*60*60
});

store.on('error', function(e) {
    console.log("SESSION STOER ERROR ", e);
});


const sessionConfig = {
    store,
    name: 'checkcheck',
    secret,
    resave : false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,        // use this when deployed. doesn't work in localhost
        sameSite: 'strict',
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig));

app.use(mongoSanitize());
app.use(helmet());

const scriptSrcUrls = [
    // "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    // "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dp3woci7k/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    if(!['/login', '/'].includes(req.originalUrl)) 
        req.session.returnTo = req.originalUrl;
    next();
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/fakeuser', async (req, res) => {
    const user = new User({username: "hero", email: "hero@hero.comm"});
    const newUser = await User.register(user, 'herohero');
    res.send(newUser);
});

// if nothing matched then
app.all('*', (req, res, next) => {
    next(new ExpressError('Not Found', 404));
});
// custom error handler middleware
app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    if(!err.status) err.status = statusCode;
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`serving on port ${port}.`);
});