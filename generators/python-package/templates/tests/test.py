from <%= packageName %> import __version__


def test_version():
    assert __version__ == "<%= version %>"
