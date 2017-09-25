function OLTool() {

	var self = this;

	self.save = function() {

		jQuery.post(window.location.href.split("/edit")[0] + "/upd", { d:self.rotation_date(), o:self.rotation_ol(), c:self.rotation_comm(), api:jQuery("#drt").data("api") }, function(data, status, xhr) {

			window.location.reload();

		});

	}

	self.rotation_date = ko.observable();
	self.rotation_ol = ko.observable();
	self.rotation_comm = ko.observable();

};

ko.applyBindings(new OLTool());
