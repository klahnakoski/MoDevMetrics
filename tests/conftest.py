import unittest
import pytest

from pyLibrary.env.files import File


def pytest_generate_tests(metafunc):
    if "path" in metafunc.funcargnames:
        ps = [f.abspathp.replace("\\", "/") for f in File("./html").children]
        metafunc.parametrize("path", ps)
