import { interpolate } from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { externalIP, dockerInstallation } from "./gcp";

const remoteInstance = new docker.Provider(
  "remote",
  {
    host: interpolate`ssh://madhankumaravelu93@${externalIP}:22`,
  },
  { dependsOn: dockerInstallation }
);

const selenoidImage = new docker.RemoteImage(
  "selenoid-image",
  {
    name: "aerokube/selenoid:1.10.7",
  },
  {
    provider: remoteInstance,
  }
);

const selenoidContainer = new docker.Container(
  "selenoid-container",
  {
    image: selenoidImage.name,
    ports: [{ internal: 4444, external: 4444 }],
    name: "selenoid",
  },
  {
    provider: remoteInstance,
  }
);

// Also before creating a container, we must first obtain a "RemoteImage", which is a reference to an external image
// that is downloaded to the local machine. In this case, we're referring to an image on Docker Hub.
const androidImage = new docker.RemoteImage(
  "android-image",
  {
    name: "selenoid/android:10.0",
    //keepLocally: true, // don't delete the image from the local machine when deleting this resource.
  },
  {
    provider: remoteInstance,
  }
);

// We can create a container using a reference to the name of the image we just downloaded and a reference to the name
// of the network that this container should use.
const androidContainer = new docker.Container(
  "android-container",
  {
    image: androidImage.name,
    command: ["--privileged"],
    restart: "on-failure",
  },
  {
    provider: remoteInstance,
  }
);

export const selenoid = selenoidContainer;
