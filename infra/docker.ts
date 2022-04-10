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

const network = new docker.Network(
  "selenoid",
  { name: "selenoid" },
  { provider: remoteInstance }
);

const androidImage = new docker.RemoteImage(
  "android-image",
  {
    name: "selenoid/android:6.0",
  },
  {
    provider: remoteInstance,
  }
);

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

const selenoidUiImage = new docker.RemoteImage(
  "selenoid-ui-image",
  {
    name: "aerokube/selenoid-ui:latest",
  },
  {
    provider: remoteInstance,
    dependsOn: selenoidImage,
  }
);

const selenoidContainer = new docker.Container(
  "selenoid-container",
  {
    image: selenoidImage.name,
    ports: [{ internal: 4444, external: 4444 }],
    name: "selenoid",
    networksAdvanced: [{ name: network.name }],
    volumes: [
      {
        hostPath: "/var/run/docker.sock",
        containerPath: "/var/run/docker.sock",
      },
      {
        hostPath: "/home/madhankumaravelu93",
        containerPath: "/etc/selenoid",
      },
    ],
    command: [
      "-conf",
      "/etc/selenoid/browsers.json",
      "-container-network",
      "selenoid",
      "-log-output-dir",
      "/opt/selenoid/logs",
      "-limit",
      "5",
      "-save-all-logs",
      "-service-startup-timeout",
      "5m",
      "-session-attempt-timeout",
      "5m",
    ],
  },
  {
    provider: remoteInstance,
    dependsOn: selenoidImage,
  }
);

const selenoidUiContainer = new docker.Container(
  "selenoid-ui-container",
  {
    image: selenoidUiImage.name,
    name: "selenoid-ui",
    networksAdvanced: [{ name: network.name }],
    ports: [{ internal: 8080, external: 8080 }],
    command: ["--selenoid-uri", "http://selenoid:4444"],
  },
  { provider: remoteInstance, dependsOn: selenoidContainer }
);

export const selenoid = selenoidContainer;
