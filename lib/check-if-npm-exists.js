/**
 * @file check if npm exists a package
 * @author hushicai(bluthcy@gmail.com)
 */


var request = require('request');
var Promise = require('bluebird');

exports = module.exports = function (pkg) {
    return new Promise(function (resolve, reject) {
        var url = 'https://www.npmjs.org/package/' + pkg;
        request(url, function (error, res) {
            if (!error && res.statusCode === 200) {
                return resolve(pkg);
            }

            return reject(false);
        });
    });
};
