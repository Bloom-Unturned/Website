const express = require('express');
const path = require('path');
const ejs = require('ejs');
const app = express();
const PORT = process.env.PORT || 2001;
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
require('dotenv').config()
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

const steamApiKey = process.env.STEAM_API_KEY;
const sessionSecret = process.env.SESSION_SECRET;
passport.use(new SteamStrategy({
  returnURL: process.env.RETURN_URL,
  realm: process.env.REALM,
  apiKey: steamApiKey,
},
(identifier, profile, done) => {
  return done(null, profile);
}));


passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(session({ secret: sessionSecret, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};
const isAdmin = (req, res, next) => {
  fetch(`https://api.bloomnetwork.online/Players/isadmin?steamid=${req.user.id}`)
  .then(response => response.json())
  .then(data => {
    console.log(data)
    if(data.result == true){
      return next();
    }
  });
  res.redirect('/auth/login');
};


app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Admin/index.ejs') });
});

app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
});

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/'); 
});

app.get('/', (req, res) => {
  console.log(req.user)
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Home/index.ejs') });
});

app.use('/images', express.static(path.join(__dirname, 'items/icons')));

app.get('/auth/login', (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Login/index.ejs') });
});

app.get('/players/:id', (req, res) => {
  const playerId = req.params.id;
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Players/player.ejs'), playerId: playerId  });
});
app.get('/guides/create', (req, res) => {
  if(!req.user) return res.redirect('/auth/steam');
  const playerId = req.params.id;
  res.render('Layouts/index', { 
    user: req.user, 
    isLoggedIn: req.isAuthenticated(), content: path.join(__dirname, 'views/Guides/create.ejs'), playerId: playerId });
});
app.get('/guides/:id', (req, res) => {
  const guideId = req.params.id;
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Guides/guide.ejs'), guideId: guideId  });
});
app.get('/guides', (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    isLoggedIn: req.isAuthenticated(), content: path.join(__dirname, 'views/Guides/index.ejs') });
});

app.get('/players', (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    isLoggedIn: req.isAuthenticated(), content: path.join(__dirname, 'views/Players/index.ejs') });
});
app.get('/profile', (req, res) => {
  if(!req.user) return res.redirect('/auth/steam');
  res.render('Layouts/Player/index', { 
    user: req.user, 
    isLoggedIn: req.isAuthenticated(), content: path.join(__dirname, 'views/Profile/index.ejs') });
});

app.get('/Items', (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Items/index.ejs') });
});
app.get('/Raid', (req, res) => {
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Raid/index.ejs') });
});
app.get('/Items/:id', (req, res) => {
  const item = req.params.id;
  res.render('Layouts/index', { 
    user: req.user, 
    content: path.join(__dirname, 'views/Items/item.ejs'), item: item  });
});

app.get('/store', (req, res) => {
  res.render('Layouts/index', { content: path.join(__dirname, 'views/Store/index.ejs') });
});
app.get('/auth/logout',(req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.use((req, res, next) => {
  res.status(404).render('Layouts/index', { content: path.join(__dirname, 'views/Errors/404.ejs') });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
