/**
 * @file main
 * @author hushicai(bluthcy@gmail.com)
 */


function buildPluginInstallTask(plugin) {
    return function (callback) {
        console.log('installing %s...', plugin);
        require('child-process-promise').exec('npm install -g ' + plugin).then(
            function (result) {
                callback(result);
            }
        ).progress(
            function(childProgress) {
                childProgress.stdout.on('data', function (data) {
                    console.log('[exec] stdout: ', data.toString());
                });
            }
        );
    };
}

exports.setup = function (conf) {
    // 项目依赖的fis插件
    var plugins = require(conf);

    require('./lib/get-installed-global-package')().then(
        function (pkgs) {
            var pkgIndex = {};

            // 标记为已安装
            pkgs.forEach(function (pkg) {
                pkgIndex[pkg.name] = 1;
            });

            var tasks = [];
            plugins.forEach(function (plugin) {
                // 如果还未安装，则安装之
                if (!pkgIndex[plugin]) {
                    tasks.push(
                        buildPluginInstallTask(plugin)
                    );
                }
            });

            if (!tasks.length) {
                console.log('所有依赖插件已经就绪!');
                return;
            }

            // 串行执行
            require('async').series(tasks);
        }
    );
};
