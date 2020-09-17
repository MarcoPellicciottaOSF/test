const fs = require('fs');
var parseString = require('xml2js').parseStringPromise;
var diffs = ['site \t pref id \t dev \t stg/dev \t comp \t stg/stg \t comp \t stg/prd \t resolve'];

function escapeTsvVal(val) {
	return (val || '').replace(/"/g, '""');
}

function stringifyValues(args) {
	for(var i = 0; i < args.length; i++) {
		if (args[i].value) {
			args[i]['_'] = JSON.stringify(args[i].value);
		}
	}
}


fs.readdirSync('sites', {withFileTypes: true}).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).forEach(dir => {
	Promise.all([parseString(fs.readFileSync('sites/' + dir + '/preferences.xml', 'utf8')), parseString(fs.readFileSync('sites/' + dir + '/preferences2.xml', 'utf8'))]).then(results => {
		let customPrefs = results[0].preferences['custom-preferences'][0];
		
		customPrefs.staging[0].preference.forEach(stgPref => {
			let devPrefDev = results[1].preferences['custom-preferences'][0].development[0].preference.find(devPref => devPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			let devPref = customPrefs.development[0].preference.find(devPref => devPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			let prdPref = customPrefs.production[0].preference.find(prdPref => prdPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			stringifyValues([devPref, stgPref, prdPref, devPrefDev]);

			let id = escapeTsvVal(stgPref['$']['preference-id']);
			devPrefDev = escapeTsvVal(devPrefDev['_']);
			devPref = escapeTsvVal(devPref['_']);
			stgPref = escapeTsvVal(stgPref['_']);
			prdPref = escapeTsvVal(prdPref['_']);
			
			if (devPref != devPrefDev) {
				//#############    Customize by each project    #####################
				let resolveTo = stgPref == prdPref ? stgPref : (devPrefDev || devPref);
				//#############    Customize by each project    #####################
				
				diffs.push(
					'"' + escapeTsvVal(dir) + '"\t' +
					'"' + id + '"\t' +
					'"' + devPrefDev + '"\t' +
					'"' + devPref + '"\t' +
					'"' + (devPref == stgPref) + '"\t' +
					'"' + stgPref + '"\t' +
					'"' + (stgPref == prdPref) + '"\t' +
					'"' + prdPref + '"\t' +
					'"' + '<preference preference-id=""' + id + '"">' + resolveTo + '</preference>' + '"'
				)
			}
		});
		
		fd = fs.writeFileSync('result.tsv', diffs.join("\r\n"));
	});
});
