# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2023-09-30

### Fixed

- Replace the deprecated Visual Studio Code extension
  [Better TOML](https://marketplace.visualstudio.com/items?itemName=bungcip.better-toml)
  with the suggested stand-in
  [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml).

## [1.2.0] - 2023-09-29

### Added

- The description and python version prompts are available as command line
  options.
- The package name and package version inputs have default prompt values when
  there is no pre-existing `pyproject.toml` file.

### Fixed

- The repository input is no longer mandatory, as per
  [the specification](https://python-poetry.org/docs/pyproject/#repository)
  of the `tool.poetry` section in `pyproject.toml`.

## [1.1.2] - 2023-09-27

### Changed

- Updated package dependencies and node.js development version.

## [1.1.1] - 2023-06-20

### Fixed

- Runtime crash due to missing `lib` directory in the npm package.

## [1.1.0] - 2023-06-05

### Added

- Configuration of Visual Studio Code for debugging with pytest.
- Generation of EditorConfig file.
- Generation of gitignore file.

## [1.0.1] - 2023-06-01

### Changed

- Internal performance improvements.

## [1.0.0] - 2023-05-21

Initial release. Features:

- Poetry-like Python package scaffolding, with source and test files.
- Poetry-ready `pyproject.toml` file.
- Visual Studio Code configuration for Python, including:
  + Code navigation, autocompletion and running.
  + Formatting on save with black and isort.
- License file.
