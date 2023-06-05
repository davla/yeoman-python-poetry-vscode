# generator-python-poetry-vscode [![Build Status][actions-image]][actions-url] [![NPM version][npm-image]][npm-url] [![Dependency status][deps-image]][deps-url]
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
    [VSCode Python extension][vscode-python-url]).
  + Formatting on save with [black](https://black.readthedocs.io/en/stable/)
    and [isort](https://pycqa.github.io/isort/).
  + [Pytest](https://docs.pytest.org/en) debugging (still courtesy of
    [VSCode Python extension][vscode-python-url]).

- [EditorConfig](https://editorconfig.org/) file (courtesy of
  [`generator-editorconf`](https://github.com/clayrisser/generator-editorconf)).

- [gitignore](https://git-scm.com/docs/gitignore) file (courtesy of
  [`generator-gi`](https://github.com/rorotikamobile/generator-gi)).

- License file (courtesy of
  [`generator-license`](https://github.com/jozefizso/generator-license)).

### Planned generated files

- Python package README.md
- asdf/pyenv file
- optional mypy
- optional linting (pylint)
- optional ci (github actions)
- poe tasks
- optional main
- retrieve latest python dependencies (optional?)

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


[npm-image]: https://img.shields.io/npm/v/generator-python-poetry-vscode.svg?logo=npm
[npm-url]: https://npmjs.org/package/generator-python-poetry-vscode
[actions-image]: https://img.shields.io/github/actions/workflow/status/davla/yeoman-python-poetry-vscode/test-and-publish.yml?branch=main&logo=github
[actions-url]: https://github.com/davla/yeoman-python-poetry-vscode/actions/workflows/test-and-publish.yml
[deps-image]: https://img.shields.io/librariesio/github/davla/yeoman-python-poetry-vscode?logo=librariesdotio
[deps-url]: https://libraries.io/github/davla/yeoman-python-poetry-vscode
[vscode-python-url]: https://marketplace.visualstudio.com/items?itemName=ms-python.python
