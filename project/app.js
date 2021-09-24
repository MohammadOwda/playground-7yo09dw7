// { autofold
var express = require('express');
var bodyParser = require('body-parser');
var cookies = require("cookie-parser");
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var dashboardHTML = "{{comments}}";
var login = false;
var gstudentid = null;
var xssdone = false;
try {
	dashboardHTML = fs.readFileSync('dashboard.html', 'utf8');
} catch (e){
}

var app = express();
app.use(express.static('.'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookies());

var db = new sqlite3.Database(':memory:');
db.serialize(function() {
  db.run("CREATE TABLE users (username varchar(20), password varchar(20))");
  db.run("INSERT INTO users VALUES ('test', 'testuserpassword')");
  db.run("CREATE TABLE comments (content TEXT)");
  db.run("INSERT INTO comments VALUES ('This is just a test comment')");
});
// }
app.post('/login', function (req, res) {
	var studentid = req.body.studentid;
    var username = req.body.username;
    var password = req.body.password;
    var query = "SELECT * FROM users where username = '" + username + "' and password = '" + password + "'";
    
    db.get(query , function(err, row) {
        if(err) {
            console.log('ERROR', err);
            res.redirect("/index.html#error");
        } else if (!row) {
            res.redirect("/index.html#unauthorized");
        } else {
			login = true;
			gstudentid = studentid;
			gstudentname = username;
			res.redirect("/dashboard");
        }
    });

});
app.get('/dashboard', function (req, res) {
	if (!login) {
		res.send ("Haha Nice try :P");
		return;
	}
	db.all("SELECT * FROM comments", [], function (err, rows){
		if (err) return;
		var commentsHTML = "";
		for (let i=0;i<rows.length;i++){
			commentsHTML += '<li class="list-group-item">'+rows[i].content+'</li>';
		}
		let ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		stcode = "";
		if (xssdone)
			stcode = Buffer.from (gstudentid + ":" + req.cookies.MohSessionID + ":" + ip + ":" + gstudentname).toString(2);
		res.send (dashboardHTML.replace ("{{comments}}", commentsHTML).replace("{{stcode}}", stcode));
	});
});
app.post('/addcomment', function (req, res) {
	var comment = req.body.comment;
	db.run("INSERT INTO comments VALUES (?)", comment);
	if (comment.indexOf ("<") != -1){
		xssdone = true;
		res.redirect("/dashboard#ThanksHacker");
	} else {
		res.redirect("/dashboard");
	}
});

app.listen(3000);
