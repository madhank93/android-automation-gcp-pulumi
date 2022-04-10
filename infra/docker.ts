import { interpolate } from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { externalIP, dockerInstallation } from "./gcp";

const remoteInstance = new docker.Provider(
  "remote",
  {
    host: interpolate`ssh://madhankumaravelu93@${externalIP}:22`,
    sshOpts: [
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "UserKnownHostsFile=/dev/null",
    ],
  },
  { dependsOn: dockerInstallation }
);

const androidImage = new docker.RemoteImage(
  "android-image",
  {
    name: "selenoid/android:10.0",
  },
  {
    provider: remoteInstance,
  }
);

// const androidContainer = new docker.Container(
//   "android-container",
//   {
//     image: androidImage.name,
//     command: ["--privileged"],
//     restart: "on-failure",
//   },
//   {
//     provider: remoteInstance,
//   }
// );

const selenoidImage = new docker.RemoteImage(
  "selenoid-image",
  {
    name: "aerokube/selenoid:1.10.7",
  },
  {
    provider: remoteInstance,
    dependsOn: androidImage,
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
    dependsOn: selenoidImage,
  }
);

export const selenoid = selenoidContainer;
