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
# SECURITY DASHBOARDS (ONLY WORK ON PRIVATE CLUSTER
##############################################################################


#TODO: FORCE TEST TO USE PUBLIC CLUSTER
@pytest.mark.parametrize("path", [
    "html/Alert-Eideticker.html",
    "html/Alert-Talos.html#platform=x86_64&sampleMax=2014-08-27&branch=Mozilla-Inbound&suite=tp5o.56.com&os=mac.OS+X+10.8"
])
def test_one_page(path):
    fullpath = path2fullpath(path)

    driver = MoDevMetricsDriver(webdriver.Firefox())

    driver.get(fullpath)
    logs = driver.wait_for_logs()
    driver.check_if_still_loading(path)# FIND ANY ERRORS IN THE LOGS

    driver.check_for_errors(logs, path)

