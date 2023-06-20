# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
