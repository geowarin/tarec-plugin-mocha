# tarec-plugin-mocha

[Tarec](http://geowarin.github.io/tarec) plugins to support writing tests with mocha and check coverage with nyc.

## Usage

First install the plugin in your project:

```
npm install tarec-plugin-mocha
```

Add it to your `tarec.yml`:

```
plugins:
  - tarec-plugin-mocha
```

Now, when you type `tarec`, you have access to the new commands (`tarec mocha` and `tarec report`) :

```
Tarec 1.1.0

Commands:
  build   Generate your bundled application in /dist
  start   Creates a dev server on port 3000
  init    Generates a simple application in the current directory
  dll     Generates dlls for your vendor dependencies - run this when you project dependencies change.
  report  Display a previously generated coverage report.
  mocha   Run tests with mocha. Your tests should be in the /test directory
```

## Examples

Pass options to mocha with `--`: 

```
tarec mocha -- -w
```

Run the tests and display html coverage report:

```
tarec mocha --coverage -o
```

