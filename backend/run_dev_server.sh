#!/bin/bash

watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- gunicorn -k gevent -w 1 -b :5001 app:app