/**
 * @file main
 * @author hushicai(bluthcy@gmail.com)
 */


var chalk = require('chalk');

function buildPluginInstallTask(plugin) {
    return function (callback) {
        console.log('installing %s...', plugin);
        require('child-process-promise').exec('npm install -g ' + plugin).then(
            function (result) {
                callback(null, true);
            },
            function (err) {
                callback(null, false);
            }
        ).progress(
            function(childProgress) {
                childProgress.stdout.on('data', function (data) {
                    console.log(data.toString());
                });
            }
        );
    };
}

function doInstallPlugin(err, plugins) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('found dependent plugins: \n', plugins);
    console.log('checking installed package...');

    plugins = plugins || [];
    require('bluebird').all([
        require('./lib/get-installed-package')('global'),
        require('./lib/get-installed-package')('local')
    ]).then(function (result) {
        var globalPkgs = result[0];
        var localPkgs = result[1];
        var pkgIndex = {};
        globalPkgs.concat(localPkgs).forEach(function (pkg) {
            if (/^fis/.test(pkg.name)) {
                pkgIndex[pkg.name] = 1;
            }
        });

        var tasks = [];
        var pluginsToInstall = [];
        plugins.forEach(function (plugin) {
            // 如果还未安装，则安装之
            if (!pkgIndex[plugin]) {
                tasks.push(
                    buildPluginInstallTask(plugin)
                );
                pluginsToInstall.push(plugin);
            }
            else {
                console.log(chalk.red(plugin) + ' is installed.');
            }
        });

        if (pluginsToInstall.length) {
            console.log('plugins need to install: \n', pluginsToInstall);
        }
        else {
            console.log('everything is ok!');
            return;
        }


        // 串行执行
        require('async').series(tasks);
    });
}

exports.setup = function () {
    require('./lib/find-dependent-package')(doInstallPlugin);
};
