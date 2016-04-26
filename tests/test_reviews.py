# encoding: utf-8
#
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Author: Kyle Lahnakoski (kyle@lahnakoski.com)
#

from __future__ import unicode_literals
import pytest

from selenium import webdriver
from util import MoDevMetricsDriver, path2fullpath



@pytest.mark.parametrize("path", [
    "html/Review-byTop.html#emails=&teamFilter=ctalbert%40mozilla.com",
    "html/Review-byReviewer.html#emails=&teamFilter=ctalbert%40mozilla.com",
    "html/Dashboard-byPatchStatus.html#productFilter=core&componentFilter=css+parsing+and+computation",
    "html/ReviewIntensity.html#requestee=&productFilter=core",
    "html/ReviewIntensity_First.html#requestee=&productFilter=core",
    "html/Reviews_NoReviewer.html",
    "html/Reviews_Pending.html",
    "html/Reviews_Pending_18.html"
])
def test_one_page(path):
    fullpath = path2fullpath(path)

    driver = MoDevMetricsDriver(webdriver.Firefox())

    driver.get(fullpath)
    logs = driver.wait_for_logs()
    driver.check_if_still_loading(path)# FIND ANY ERRORS IN THE LOGS

    driver.check_for_errors(logs, path)

