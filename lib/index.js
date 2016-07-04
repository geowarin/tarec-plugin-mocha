module.exports = function mochaPlugin (context, operations) {

  var chalk = operations.dependencies.resolve('chalk');
  var open = operations.dependencies.resolve('open');
  var path = require('path');

  operations.commands.add('report')
    .summary(`Display a previously generated coverage report.`)
    .option('reporter', {
      alias: 'r',
      default: 'lcov',
      describe: 'Choose coverage reporter. Accepted values: text, clover, lcov. Default: lcov'
    })
    .option('open', {alias: 'o', default: true, describe: 'Open the report if possible'})
    .apply((context, args) => {
      showCoverage(context, args.reporter, args.open);
    });


  operations.commands.add('mocha')
    .summary(`Run tests with mocha. Your tests should be in the ${chalk.magenta('/test')} directory`)
    .option('coverage', {default: false, describe: 'Generate coverage'})
    .option('reporter', {alias: 'r', default: 'none', describe: 'Choose coverage reporter (lcov, text, clover...)'})
    .option('open', {alias: 'o', default: false, describe: 'Open the report if possible'})
    .example(`Pass options to mocha: ${chalk.green('tarec mocha -- -w')}`)
    .example(`Open html report: ${chalk.green('tarec mocha --coverage -o')}`)
    .before(() => {
      process.env.NODE_ENV = 'test';
      process.env.BABEL_CONFIG = JSON.stringify(context.babelConfig);
      process.env.BABEL_CACHE_PATH = path.join(context.projectDir, '.tarec/babel-cache/tests.json');
    })
    .apply((context, args) => {

      const babel = require.resolve('./babel');
      const testDir = path.join(context.projectDir, 'test');
      const mochaBin = path.join(context.projectDir, 'node_modules/.bin/mocha');

      let mochaCmd = [mochaBin, '--recursive', testDir];
      const moreOptions = args._.slice(1);
      if (moreOptions.length > 0) {
        mochaCmd = mochaCmd.concat(moreOptions);
      }

      if (args.coverage) {

        const exclusions = ['dist', 'test', 'coverage'];
        const inclusions = ['src'];
        const extensions = ['js', 'jsx'];

        const nycBin = path.join(context.projectDir, 'node_modules/.bin/nyc');
        let cmd = [nycBin, '--all', '--require', babel];
        for (let exclusion of exclusions) {
          cmd = cmd.concat('--exclude', exclusion);
        }
        for (let inclusion of inclusions) {
          cmd = cmd.concat('--include', inclusion);
        }
        for (let extension of extensions) {
          cmd = cmd.concat('--extension', extension);
        }
        cmd = cmd.concat('--reporter', args.reporter);
        cmd = cmd.concat('--source-map', 'true');
        cmd = cmd.concat('--report-dir', path.join(context.projectDir, '.tarec/coverage'));
        cmd = cmd.concat(mochaCmd);

        exec(context, cmd);
        if (args.open) {
          showCoverage(context, 'lcov', true);
        } else {
          showCoverage(context, 'text', false);
        }

      } else {
        const cmd = mochaCmd.concat('--require', babel);
        exec(context, cmd);
      }
    });

  function exec (context, args) {
    var execSync = require('child_process').execSync;
    const execOptions = {cwd: context.projectDir, stdio: ['inherit', 'inherit', 'inherit']};
    if (process.platform === 'win32') {
      args = ['cmd', '/c', ...args];
    }
    try {
      execSync(args.join(' '), execOptions)
    } catch (ignored) {
    }
  }

  function showCoverage (context, reporter, shouldOpen) {

    const nycBin = path.join(context.projectDir, 'node_modules/.bin/nyc');
    const reportDir = path.join(context.projectDir, '.tarec/coverage');
    const reportIndex = path.join(reportDir, 'lcov-report/index.html');
    let cmd = [nycBin, 'report'];
    cmd = cmd.concat('--reporter', reporter);
    cmd = cmd.concat('--report-dir', reportDir);

    exec(context, cmd);

    if (reporter === 'lcov' || reporter === 'clover') {
      console.log(`Coverage report written to ${chalk.magenta(reportDir)}`);
    }

    if (shouldOpen && reporter === 'lcov') {
      open(reportIndex);
    }

  }
};
