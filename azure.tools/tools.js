const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const compression = require("compression")
const helmet = require("helmet")
const jade = require("jade")
const vm = require("vm")
const mustache = require("mustache")
const uuid = require('node-uuid')
const async = require('async')
const moment = require('moment')
const sqlite3 = require('sqlite3')

const app = express();

vm.runInThisContext(fs.readFileSync(__dirname + "/azure.config"))

app.use(express.static("pub"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({"limit":"180b"}))
app.use(compression())
app.use(helmet.noCache())

app.disable("x-powered-by")

const db = new sqlite3.Database(DB_ESAR)

TEMPLATE_ESAR_DUTYOL = fs.readFileSync(__dirname + '/templates/kcesar.rotation.txt').toString()

// ..... operations oriented .....

app.get(OPERATIONS + "/dol/csv", function (req, res) {

	rotation(function(rs) {

		var html = "Date,OL,OL Call,OL Cell,Comm Op,COCall,COCell,Van" + "\r\n"

		rs.forEach(function(row) {

			html += moment(new Date(row.d)).format("D-MMM") + "," + row.on + "," + row.oc + "," + row.op + "," + row.cn + "," + row.cs + "," + row.cp + "," + row.vd + "\r\n"

		})

		res.end(html)

	})

});

app.get(OPERATIONS + "/dol/json", function (req, res) {

	rotation(function(rs) { res.json(rs); res.end(); })

});

app.get(OPERATIONS + "/doc", function (req, res) {

	rotation(function(rs) {

		var html = mustache.render(TEMPLATE_ESAR_DUTYOL, { rot:rs })

		res.writeHead(200, {
			"Content-Type": "text/html",
			"Content-Length": html.length,
			"Expires": new Date().toUTCString(),
			"x-timestamp": new Date().toUTCString()
		})

		res.end(html)

	})

});

app.get(OPERATIONS + "/doc/edit", function (req, res) {

	var ops = [], comms = [], days = []

	db.all("SELECT k,named FROM ols", function(err, rs) {

		rs.forEach(function(row) {

			ops.push({ k:row.k, n:row.named })

		})

		db.all("SELECT k,named FROM comms", function(err, rs) {

			rs.forEach(function(row) {

				comms.push({ k:row.k, n:row.named })

			})

			db.all("SELECT k,start_date FROM duty_rotation", function(err, rs) {

				rs.forEach(function(row) {

					days.push({ k:row.k, d:row.start_date })

				})

				rotation(function(rs) {

					var html = mustache.render(fs.readFileSync(__dirname + "/templates/kcesar.rotation.editor.txt").toString(), { rot:rs, OR:ops,CR:comms,RD:days,api:API_KEY })

					res.writeHead(200, {
						"Content-Type": "text/html",
						"Content-Length": html.length,
						"Expires": new Date().toUTCString(),
						"x-timestamp": new Date().toUTCString()
					})

					res.end(html)

				})

			})

		})

	})

});

app.post(OPERATIONS + "/doc/upd", function (req, res) {

	if (!req.body) return res.sendStatus(400)

	if (API_KEY != req.body.api) return res.sendStatus(400)

	if (req.body.o > 1) db.run("UPDATE duty_rotation SET ol= " + req.body.o + " WHERE k=" + req.body.d, function(e,rs){})

	if (req.body.c > 1) db.run("UPDATE duty_rotation SET comm= " + req.body.c + " WHERE k=" + req.body.d, function(e,rs){})

	setTimeout(function(){ res.end(); }, 750)

});

app.get("/ranks/:rank", function(req, res) {

	var bag = { ranked:[], titled:req.params.rank.toUpperCase() }

	bag.ranked.push({ named:"Team Leader", db:"<database_page>" })

	var raw = jade.renderFile("templates/rank.jade", bag, { pretty: true })

	var html = mustache.render(raw, bag)

	res.writeHead(200, {
		"Content-Type": "text/html",
		"Content-Length": html.length,
		"Expires": new Date().toUTCString()
	})

	res.end(html)

})

// ..... comms oriented .....

app.get("/comms/page.scout", function(req, res) {

	var html = jade.renderFile("templates/paging.scout.jade", { args:{ API:API_KEY }, pretty:true })

	res.writeHead(200, {
		"Content-Type": "text/html",
		"Content-Length": html.length,
		"Expires": new Date().toUTCString()
	})

	res.end(html)

})

app.post("/comms/page.scout", function(req, res) {

	if (!req.body) return res.sendStatus(400)

	if (!req.body.hasOwnProperty("api")) return res.sendStatus(400)
	if (!req.body.hasOwnProperty("pk")) return res.sendStatus(400)

	if ((API_KEY == req.body.api) && (DOOR_KEY == req.body.pk)) {

		PageMessage(req.body.msg)

		res.end()

	} else {

		return res.sendStatus(400)

	}

})

app.all("*", function(req, res) {

	res.end()	// catch all

});

app.listen(WWW_PORT, IP, function() {});

function PageMessage (msg) {

	var api_options = {}

	api_options.url = PAGER_GATEWAY

	api_options.method = "POST"

	api_options.headers = { "Content-Type":"application/x-www-form-urlencoded", "User-Agent":ORGANIZATION, "Connection":"close" }

	api_options.form = { "pin":PAGER_PIN, "q1":"0", "mssg":msg }

	request(api_options, function (err, resp, body) {

	})

}

function rotation (callback) {

	var db = new sqlite3.Database(DB_ESAR)

	db.all("SELECT D.k AS Z, start_date AS SD, O.named AS DOL, O.callsign AS DOLCS, O.phone AS OLPHONE, C.named AS CN, C.callsign AS CS, C.phone AS CP, V.named AS VD FROM duty_rotation D INNER JOIN ols O ON D.ol=O.k INNER JOIN comms C ON D.comm=C.k INNER JOIN drivers V ON D.van=V.k ORDER BY D.k", function(err,rs) {

		var matrix = []

		rs.forEach(function(a) {

			matrix.push({ n:a.Z, d:a.SD, on:a.DOL, oc:a.DOLCS, op:a.OLPHONE, cn:a.CN, cs:a.CS, cp:a.CP, vd:a.VD, T1:("TBD" != a.DOL)?'clean':'dirty', T2:("TBD" != a.CN)?'clean':'dirty' });

		})

		callback(matrix)

	})

}

