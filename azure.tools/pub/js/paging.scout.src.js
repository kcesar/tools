function Scout() {

	var self = this;

	self.clicked = function(obj) {

		document.getElementById("msg").value = obj.innerText;

	}

	self.send = function(ak) {

		if (e("msg").value.toString().length && e("k").value.toString().length) {

			aja().method("post").url("").cache(false).data({ msg:e("msg").value, api:ak, pk:e("k").value }).on("200", function(resp) {

				document.body.innerHTML = "Sent";

			}).go();

		}

	}

};

function e(id) { return document.getElementById(id); }

var scout = new Scout();

window.onload = function() { document.getElementById("msg").focus(); };