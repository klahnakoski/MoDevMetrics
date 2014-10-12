from pyLibrary.cnv import CNV
from pyLibrary.env.files import File
from pyLibrary.env.logs import Log
from pyLibrary.thread.threads import Thread
import pytest

from selenium import webdriver

LOG_DIV = "test_logs"


@pytest.mark.parametrize("path", [
    "html/Review-byTop.html#emails=&teamFilter=ctalbert%40mozilla.com",
    "html/Review-byReviewer.html#emails=&teamFilter=ctalbert%40mozilla.com",
    "html/Dashboard-byPatchStatus.html#productFilter=core",
    "html/ReviewIntensity.html#requestee=&productFilter=core",
    "html/ReviewIntensity_First.html#requestee=&productFilter=core",
    "html/Reviews_NoReviewer.html",
    "html/Reviews_Pending.html",
    "html/Reviews_Pending_18.html"
])
def test_one_page(path):
    path = "file:///" + File(path).abspath
    if path.find("#") >= 0:
        path = path.replace("#", "#log=" + LOG_DIV + "&")
    else:
        path = path + "#log=" + LOG_DIV

    driver = BetterDriver(webdriver.Firefox())
    driver.get(path)

    logs = wait_for_logs(driver)

    # IF SPINNER STILL SHOWS, THEN WE GOT LOADING ISSUES
    isLoading = driver.find(".loading")
    if isLoading:
        Log.error("page still loading: {{page}}", {"page": path})

    # FIND ANY ERRORS IN THE LOGS
    try:
        errors = [l for l in logs if l.type == "ERROR"]
        if errors:
            Log.error("Problem found in {{page}}:\n{{error|indent}}", {
                "page": path,
                "error": errors[0]
            })
    finally:
        driver.close()


def wait_for_logs(driver):
    old_length = -1
    elements = driver.find("#" + LOG_DIV + " p")
    while len(elements) != old_length:
        Thread.sleep(seconds=10)
        old_length = len(elements)
        elements = driver.find("#" + LOG_DIV + " p")

    return [CNV.JSON2object(CNV.html2unicode(e.get_attribute('innerHTML'))) for e in elements]


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
