const fs = require('fs');
var parseString = require('xml2js').parseStringPromise;
var diffs = ['site \t pref id \t stg/dev \t stg/stg \t stg/prd'];

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


fs.readdirSync('temp/sites', {withFileTypes: true}).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).forEach(dir => {
	parseString(fs.readFileSync('temp/sites/' + dir + '/preferences.xml')).then(results => {
		let customPrefs = results.preferences['custom-preferences'][0];
		
		customPrefs.staging[0].preference.forEach(stgPref => {
			let devPref = customPrefs.development[0].preference.find(devPref => devPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			let prdPref = customPrefs.production[0].preference.find(prdPref => prdPref['$']['preference-id'] == stgPref['$']['preference-id']) || {'_': ''};
			stringifyValues([devPref, stgPref, prdPref]);

			let id = escapeTsvVal(stgPref['$']['preference-id']);
			devPref = escapeTsvVal(devPref['_']);
			stgPref = escapeTsvVal(stgPref['_']);
			prdPref = escapeTsvVal(prdPref['_']);
			
			if (devPref != stgPref) { // || (prdPref == '' && stgPref != '')) {
				diffs.push(
					'"' + escapeTsvVal(dir) + '"\t' +
					'"' + id + '"\t' +
					'"' + devPref + '"\t' +
					'"' + stgPref + '"\t' +
					'"' + prdPref + '"'
				)
			}
		});
		
		fd = fs.writeFileSync('result.tsv', diffs.join("\r\n"));
	}).catch(err => {
		console.log(err);
	});
});
