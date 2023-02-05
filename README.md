# generator-python-poetry-vscode [![NPM version][npm-image]][npm-url] [![Build Status][actions-image]][actions-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Yeoman generator for Python packages, using [Poetry](https://python-poetry.org/) and integrated with [Visual Studio Code](https://code.visualstudio.com/)

## Installation

First, install [Yeoman](http://yeoman.io) and generator-python-poetry-vscode
using [npm](https://www.npmjs.com/) (we assume you have pre-installed
[node.js](https://nodejs.org/)).

```bash
npm install -g yo generator-python-poetry-vscode
```

Then, you'll need to install Poetry. Follow the
[instructions](https://python-poetry.org/docs/#installation) on the project's
website.

Then generate your new project:

```bash
yo python-poetry-vscode
```

## Generated files
The `python-poetry-vscode` Yeoman generator provides the following:

- [Poetry-like](https://python-poetry.org/docs/cli/#new) Python package
  scaffolding, with source and test files.

- [Poetry-ready](https://python-poetry.org/docs/pyproject/) `pyproject.toml`
  file.

- [Visual Studio Code](https://code.visualstudio.com/) configuration for
  Python, including:
  + Code navigation, autocompletion and running (courtesy of the
    [VSCode Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)).
  + Formatting on save with [black](https://black.readthedocs.io/en/stable/)
    and [isort](https://pycqa.github.io/isort/).

- License file (courtesy of
  [`generator-license`](https://github.com/jozefizso/generator-license)).

### Planned generated files

- VSCode debugging configuration
- Editorconfig
- Python package README.md
- asdf/pyenv file
- gitignore
- optional mypy
- optional linting (pylint)
- optional ci (github actions)
- poe tasks

## Other features

The `python-poetry-vscode` generator does its best to ask as few questions as
possible without having an educatedly guessed default answer.

Educated guesses are made based on the environment the generator runs in, for
instance the git configuration or the currently installed version of a
dependency. A great source of infomration is an existing `pyproject.toml`, as
it's there that most of the unguessable answers are saved, like the Python
package description.

Furthermore, the vast majority of interactive prompts are also available as
command-line options. If the CLI options are given, the prompts aren't
displayed.

## Getting To Know Yeoman

 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).

## License

GPL-3.0 © [Davide Laezza](https://github.com/davla)


[npm-image]: https://badge.fury.io/js/generator-python-poetry-vscode.svg
[npm-url]: https://npmjs.org/package/generator-python-poetry-vscode
[actions-image]: https://github.com/davla/yeoman-python-poetry-vscode/actions/workflows/test.yml/badge.svg
[actions-url]: https://github.com/davla/yeoman-python-poetry-vscode/actions/workflows/test.yml
[daviddm-image]: https://david-dm.org/davla/generator-python-poetry-vscode.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/davla/generator-python-poetry-vscode
