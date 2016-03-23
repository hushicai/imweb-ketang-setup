/**
 * @file 分析`fis-conf.js`，找出项目依赖的插件
 * @author hushicai(bluthcy@gmail.com)
 */

var fs = require('fs');
var chalk = require('chalk');

module.exports = exports = function (cb) {
    function buildCheckFisVersionTask(name) {
        return function (callback) {
            console.log('checking: ' + name + '...');

            var checkIfNpmExists = require('./check-if-npm-exists');

            var fisPkg = 'fis-' + name;
            var fis3Pkg = 'fis3-' + name;

            checkIfNpmExists(fisPkg).then(function (value) {
                return value;
            }, function () {
                return checkIfNpmExists(fis3Pkg);
            }).then(function (value) {
                console.log(chalk.red('get ' + value));
                callback(null, value);
            }, function () {
                console.log('fail');
                callback('fail');
            });
        };
    }

    // 内置的plugins
    var index = {
        'optimizer-clean-css': 1,
        'optimizer-png-compressor': 1,
        'optimizer-uglify-js': 1,
        'spriter-csssprites': 1,
        'deploy-local-deliver': 1,
        'deploy-http-push': 1,
        'hook-components': 1,
        'packager-map': 1
    };

    function findDependentFromConf() {
        var cwd = process.cwd();
        var conf = require('path').join(cwd, 'fis-conf.js');
        var content = fs.readFileSync(conf);
        var esprima = require('esprima');
        var ast = esprima.parse(content);

        var tasks = [];
        var deps = [];
        require('estraverse').traverse(ast, {
            enter: function (node, parent) {
                if (node.type === 'CallExpression'
                    && node.callee.type === 'MemberExpression'
                && node.callee.object.name === 'fis'
                   ) {
                       if (node.callee.property.name === 'hook') {
                           // 找出hook调用
                           var hookName = node.arguments[0].value;
                           var hook = 'hook-' + hookName;
                           if (!index[hook]) {
                               tasks.push(buildCheckFisVersionTask(hook));
                               index[hook] = 1;
                               deps.push(hook);
                           }
                           return this.skip();
                       }
                       else if (node.callee.property.name === 'plugin') {
                           var pluginName = node.arguments[0].value;
                           var parents = this.parents(node);

                           for (var len = parents.length - 1; len >= 0; len--) {
                               var n = parents[len];

                               if (n.type === 'Property') {
                                   var plugin = n.key.name + '-' + pluginName;
                                   if (!index[plugin]) {
                                       tasks.push(buildCheckFisVersionTask(plugin));
                                       index[plugin] = 1;
                                       deps.push(plugin);
                                   }

                                   return this.skip();
                               }
                           }
                       }
                   }
            }
        });

        console.log('plugins found from `fis-conf.js` without built-ins: \n', deps);
        return tasks;
    }

    // 查找依赖
    var tasks = findDependentFromConf();

    console.log('checking fis version...');

    require('async').series(tasks, cb);
};
