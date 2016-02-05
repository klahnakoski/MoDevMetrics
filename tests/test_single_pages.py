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

##############################################################################
# SINGLE PAGE DASHBOARDS, UNRELATED TO ANY OTHER THEME
##############################################################################

@pytest.mark.parametrize("path", [
    "html/Partner-Bugs.html#sampleMax=2014-10-25&sampleMin=2014-06-08",
    "html/Partner-Bugs.html",
])
def test_one_page(path):
    fullpath = path2fullpath(path)

    driver = MoDevMetricsDriver(webdriver.Firefox())

    driver.get(fullpath)
    logs = driver.wait_for_logs()
    driver.check_if_still_loading(path)# FIND ANY ERRORS IN THE LOGS

    driver.check_for_errors(logs, path)

