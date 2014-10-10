import os
from pyLibrary.env.logs import Log
from pyLibrary.thread.threads import Thread

from selenium import webdriver
from selenium.webdriver import DesiredCapabilities


def test_one_page(path):
    d = DesiredCapabilities.FIREFOX
    d['loggingPrefs'] = {"browser": 'ALL'}
    # d['webdriver.log.file'] = "c:\\temp\\firefox.log"
    # os.environ['webdriver.log.file'] = "c:\\temp\\firefox.log"
    driver = webdriver.Firefox(capabilities=d)
    driver.get("file:///"+path)

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
    logs = []
    new_logs = driver.get_log('browser')
    logs.extend(new_logs)
    while len(new_logs) > 1:
        Thread.sleep(seconds=10)
        new_logs = driver.get_log('browser')
        logs.extend(new_logs)
    return logs

