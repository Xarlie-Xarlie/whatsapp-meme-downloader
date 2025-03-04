#!/bin/sh  

find ./videos -type f -not -newermt $(date +%F) -delete
