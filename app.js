var express = require ('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
app.set('view engine','ejs');
app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true
}));
app.use('/public', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({extended: true }));

app.get('/', function (req, res){
    res.render("home", {loggedIn: req.session.loggedIn});
});

app.get('/login', function(req, res) {
    res.render('login.ejs', {loggedIn: req.session.loggedIn, message: ''});
});

app.post('/auth', function(req, res) {
    //console.log(req.body);
    let name = req.body.username;
    let password = req.body.password;
    if (name && password) {
        conn.query('SELECT * FROM users WHERE name = ? AND password = ?', [name, password], 
            function(error, results, fields) {
                if (error) throw error;
                if (results.length > 0) {
                    req.session.loggedIn = true;
                    req.session.username = name;
                    res.redirect('/membersOnly');
                } else {
                    res.render('login.ejs', {loggedIn: req.session.loggedIn, message: 'Incorrect Username and/or Password!'});
                    //res.send('Incorrect Username and/or Password!'); 
                }
                res.end();
            });
    }   else {
        res.send('Please enter Username and/or Password!');
        res.end();
    }
});

//Users can access this if they are logged in
app.get('/membersOnly', function (req, res, next) {
    if (req.session.loggedIn) {
        res.render('membersOnly', {loggedIn: req.session.loggedIn});
    }
    else {
        res.send('Please login to view this page!');
    }
});

//Register user
app.get('/register', function (req, res, next) {
    res.render('register.ejs', {loggedIn: req.session.loggedIn});
});

app.post('/register', function(req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;
    let errors = [];
    // Check password
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        var sql = `INSERT INTO users (name, email, password, password2) VALUES ('${name}', '${email}', '${password}', '${password2}')`;
    conn.query(sql, function(err, result) {
        if (err) throw err;
        console.log('Registered successfully');
        res.render('login');
    });
    }
    
});

//Add new MP
app.get('/addMPs', function (req, res, next) {
    if (req.session.loggedin) {
        res.render('addMPs.ejs', {loggedIn: req.session.loggedIn});
    }
    else {
        res.send('Please login to view this page!');
    }
}); 

app.post('/addMPs', function(req, res, next) {
    var id = req.body.id;
    var name = req.body.name;
    var party = req.body.party;
    var sql = `INSERT INTO mps (id, name, party) VALUES ('${id}', '${name}', '${party}')`;
    conn.query(sql, function(err, result) {
        if (err) throw err;
        console.log('record inserted');
        res.render('addMPs');
    });
});


//Remove MP 
app.get('/removeMPs', function (req, res, next) {
    if (req.session.loggedin) {
        res.render('removeMPs', {loggedIn: req.session.loggedIn});
    }
    else {
        res.send('Please login to view this page!');
    }
}); 

app.post('/removeMPs', function(req, res, next) {
    var name = req.body.name;
    var sql = `DELETE FROM mps WHERE name ='${name}'`;
    conn.query(sql, function(err, result) {
        if (err) throw err;
        console.log('record removed');
        res.render('removeMPs');
    });
});

//Show list of MPs
app.get('/listMPs', function (req, res){
    conn.query("SELECT * FROM mps", function (err, result) {
        if (err) throw err;
        console.log(result);
        res.render('listMPs', {title: 'List of NZ MPs', MPsData: result, loggedIn: req.session.loggedIn});
    });
});
app.get('/auckland', function (req, res){
    res.render("auckland", {loggedIn: req.session.loggedIn});
});

app.get('/beaches', function (req, res){
    res.render("beaches", {loggedIn: req.session.loggedIn});
});

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000);
console.log('Node app is running on port 3000');
