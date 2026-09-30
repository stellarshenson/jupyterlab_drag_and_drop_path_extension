"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
import os

from jupyterlab.galata import configure_jupyter_server

configure_jupyter_server(c)

# configure_jupyter_server pins port 8888 with port_retries = 0, so the test server
# dies rather than move when that port is already taken. Read the port from the
# environment so a developer running their own lab on 8888 can still run the suite.
# `or`, not a get() default: an exported-but-empty value must fall back too.
c.ServerApp.port = int(os.environ.get("JUPYTER_TEST_PORT") or "8888")

# This machine runs JupyterHub, whose service prefix would otherwise leak into the
# test server and move every URL under /user/<name>/. Pin the root so the suite
# addresses the same base_url in every environment.
c.ServerApp.base_url = "/"

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"

# Every lab extension installed on the host is enabled in this server, and the
# GalaxaHub message-of-the-day extension opens its own tab on lab start. Galata
# waits for the Launcher to be the active tab before it hands a page to a test,
# so that tab makes every test in the suite time out before its first line runs.
c.GalaxaHubMotd.open_on_start = False
