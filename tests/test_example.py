import unittest
import pytest

from selenium import webdriver


class TestAll(unittest.TestCase):

    def setUp(self):
        self.browser = webdriver.Firefox()

    @pytest.mark.parametrize("path", [
        ("file:///C:/Users/klahnakoski/git/MoDevMetrics/html/Bug-Ages.html")
    ])
    def test_page(self, path):
        self.browser.get("file:///"+path)
        assert True


    def tearDown(self):
        self.browser.close()






