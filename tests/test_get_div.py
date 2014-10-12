from pyLibrary.env.files import File
from pyLibrary.thread.threads import Thread

from selenium import webdriver


def test_one_page():
    driver = BetterDriver(webdriver.Firefox())
    driver.get(File("html/test.html").abspath)

    logs = wait_for_logs(driver)

    # print messages
    try:
        for l in logs:
            if l["message"].find("Hello World") >= 0:
                break
        else:
            assert False
    finally:
        driver.close()


def wait_for_logs(driver):
    old_length = -1
    elements = driver.find("#test p")
    while len(elements) != old_length:
        Thread.sleep(seconds=10)
        old_length = len(elements)
        elements = driver.find("#test p")

    return [e.text for e in elements]


class BetterDriver(object):
    def __init__(self, driver):
        self.driver = driver

    def find(self, selector):
        try:
            return self.driver.find_elements_by_css_selector(selector)
        except Exception, e:
            return []

    def get(self, *args, **kwargs):
        self.driver.get(*args, **kwargs)
        return self

    def close(self, *args, **kwargs):
        self.driver.close(*args, **kwargs)
        return self
