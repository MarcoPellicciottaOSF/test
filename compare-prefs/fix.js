const fs = require('fs');

let exportDir = 'temp/sites/';
fs.readdirSync(exportDir, {withFileTypes: true}).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).forEach(siteDir => {
	let prefFileName = exportDir + siteDir + '/preferences.xml';
	let prefFile = fs.readFileSync(prefFileName, 'utf8');
	prefFile = prefFile.replace(/<standard\-preferences>.*?<\/standard\-preferences>/s, '');
	prefFile = prefFile.replace('<all-instances/>', '');
	prefFile = prefFile.replace(/<development>.*?<\/development>/s, '');
	prefFile = prefFile.replace(/<production>.*?<\/production>/s, '');
	prefFile = prefFile.replace('<staging>', '<development>');
	prefFile = prefFile.replace('</staging>', '</development>');
	fs.writeFileSync(prefFileName, prefFile);
});
