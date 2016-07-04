var babelConfig = JSON.parse(process.env.BABEL_CONFIG);
require('babel-register')(babelConfig);
require('ignore-styles');

