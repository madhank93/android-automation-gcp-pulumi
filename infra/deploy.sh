#!/bin/bash

sudo apt-get update

sudo apt-get -y install docker.io docker-compose

# add current user to docker group so there is no need to use sudo when running docker
sudo usermod -aG docker $(whoami)