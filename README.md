# Ruby TypeProf Action

This is a GitHub Action for [Ruby TypeProf](https://github.com/ruby/typeprof).
Every time your code is changed, TypeProf analyzes the code and this Action reports errors found.

## Demo

Here is an [example](https://github.com/ybiquitous/typeprof-action/actions/runs/334198641) of results.

## Usage

For example, you can create `.github/workflows/typeprof.yml` as follows:

```yaml
name: TypeProf

on: push

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: 2.7
      - run: gem install typeprof
      - uses: ybiquitous/typeprof-action@main
        with:
          file: lib/foo.rb
          # file: script/*.rb
          # token: ${{ secrets.YOUR_GITHUB_TOKEN }}
          # use-bundler: true
```

See also [`action.yml`](action.yml) about the available options.

## License

[MIT](LICENSE) © Masafumi Koba
