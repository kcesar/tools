const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const compression = require("compression")
const helmet = require("helmet")
const jade = require("jade")
const vm = require("vm")
const mustache = require("mustache")

const app = express();

vm.runInThisContext(fs.readFileSync(__dirname + "/azure.config"))

app.use(express.static("pub"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({"limit":"180b"}))
app.use(compression())
app.use(helmet.noCache())

app.disable("x-powered-by")

// ..... operations oriented .....

app.get("/ranks/:rank", function(req, res) {

	var bag = { ranked:[], titled:req.params.rank.toUpperCase() }

	bag.ranked.push({ named:"Fred Flinestone", db:"https://database.kcsara.org/123456789" })

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
