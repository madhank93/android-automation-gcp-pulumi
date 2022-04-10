#!/usr/bin/env bash

while [ ! -f /var/lib/cloud/instance/boot-finished ]; do echo 'Waiting for cloud-init...'; sleep 1; done


sudo apt-get update

sudo apt-get -y install docker.io docker-compose

# add current user to docker group so there is no need to use sudo when running docker
sudo usermod -aG docker $(whoami)
newgrp - docker