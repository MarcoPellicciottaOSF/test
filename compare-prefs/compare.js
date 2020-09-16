const fs = require('fs');
var parseString = require('xml2js').parseString;
var diffs = ['site \t pref id \t dev \t stg \t prd'];

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
	parseString(fs.readFileSync('sites/' + dir + '/preferences.xml'), function (err, result) {
		let customPrefs = result.preferences['custom-preferences'][0];
		customPrefs.staging[0].preference.forEach(stgPref => {
			let devPref = customPrefs.development[0].preference.find(devPref => devPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			let prdPref = customPrefs.production[0].preference.find(prdPref => prdPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			stringifyValues([devPref, stgPref, prdPref]);
			
			if (devPref['_'] != stgPref['_'] || stgPref['_'] != prdPref['_']) {
				diffs.push(
					'"' + escapeTsvVal(dir) + '"\t' +
					'"' + escapeTsvVal(stgPref['$']['preference-id']) + '"\t' +
					'"' + escapeTsvVal(devPref['_']) + '"\t' +
					'"' + escapeTsvVal(stgPref['_']) + '"\t' +
					'"' + escapeTsvVal(prdPref['_']) + '"'
				)
			}
		});
    });
});

fd = fs.writeFileSync('result.tsv', diffs.join("\r\n"));