/**
 * @file 获取用户已经安装的全局package
 * @author hushicai(bluthcy@gmail.com)
 */


module.exports = function (type) {
    var exec = require('child-process-promise').exec;
    var cmd = 'npm list --depth=0' + (type === 'global' ? ' -g' : '');

    // 返回promise
    return exec(cmd).then(function (result) {
        var stdout = result.stdout;

        var pkgs = stdout.trim().split('\n');
        // 删掉第一行路径
        pkgs.shift();
        // 获取package名字和版本信息
        pkgs = pkgs.map(function (pkg) {
            var temp = pkg.split(/\s/)[1];
            var reg = /^([\w\-]+?)@((\d+?(\.|$))+)/
            var matches = temp.match(reg);
            return {
                name: matches[1],
                version: matches[2]
            };
        });
        return pkgs;
    }, function (result) {
        console.log(result.stderr);
        return [];
    });
};
