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
    .example(`Pass options to mocha: ${chalk.green('tarec mochaTest -- -w')}`)
    .example(`Open html report: ${chalk.green('tarec mochaTest --coverage -r lcov -o')}`)
    .before(() => {
      process.env.NODE_ENV = 'test';
      process.env.BABEL_CONFIG = JSON.stringify(context.babelConfig);
      process.env.BABEL_CACHE_PATH = path.join(context.projectDir, '.tarec/babel-cache/tests.json');
    })
    .apply((context, args) => {

      const babel = require.resolve('./babel');
      const testDir = path.join(context.projectDir, 'test');
      let mochaCmd = ['./node_modules/.bin/mocha', '--recursive', testDir];
      const moreOptions = args._.slice(1);
      if (moreOptions.length > 0) {
        mochaCmd = mochaCmd.concat(moreOptions);
      }

      if (args.coverage) {

        const exclusions = ['dist', 'test', 'coverage'];
        const inclusions = ['src'];
        const extensions = ['js', 'jsx'];

        let cmd = ['./node_modules/.bin/nyc', '--all', '--require', babel];
        cmd = cmd.concat('--exclude', exclusions.join(','));
        cmd = cmd.concat('--include', inclusions.join(','));
        cmd = cmd.concat('--extension', extensions.join(','));
        cmd = cmd.concat('--reporter', args.reporter);
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
    execSync(args.join(' '), execOptions)
  }

  function showCoverage (context, reporter, shouldOpen) {

    const reportDir = path.join(context.projectDir, '.tarec/coverage');
    const reportIndex = path.join(reportDir, 'lcov-report/index.html');
    let cmd = ['./node_modules/.bin/nyc', 'report'];
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
