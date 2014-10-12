from pyLibrary.env.files import File

from selenium import webdriver


def test_one_page():
    driver = webdriver.Firefox()
    driver.get(File("html/test.html").abspath)

    elements = driver.find_elements_by_css_selector("#test p")

    # print messages
    try:
        for l in [e.get_attribute('innerHTML') for e in elements]:
            if l.find("Hello World") >= 0:
                assert True
                return
        else:
            assert False
    finally:
        driver.close()


