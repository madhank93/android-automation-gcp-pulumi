import * as docker from "@pulumi/docker";

// Also before creating a container, we must first obtain a "RemoteImage", which is a reference to an external image
// that is downloaded to the local machine. In this case, we're referring to an image on Docker Hub.
const androidImage = new docker.RemoteImage("android-image", {
  name: "selenoid/android:10.0",
  //keepLocally: true, // don't delete the image from the local machine when deleting this resource.
});

// We can create a container using a reference to the name of the image we just downloaded and a reference to the name
// of the network that this container should use.
const androidContainer = new docker.Container("android", {
  image: androidImage.name,
  command: ["--privileged"],
  restart: "on-failure",
});
