import { interpolate } from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { externalIP, dockerInstallation, selenoidBrowserJson } from "./gcp";

// Remote docker connection
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

// Create a network in Docker
const network = new docker.Network(
  "selenoid",
  { name: "selenoid" },
  { provider: remoteInstance }
);

// Download Android image in remote instance
const androidImage = new docker.RemoteImage(
  "android-image",
  {
    name: "selenoid/android:6.0",
  },
  {
    provider: remoteInstance,
  }
);

// Download Selenoid image in remote instance
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

// Download Selenoid UI image in remote instance
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

// Download Android demo test image, contains test scripts
const androidDemoTestImage = new docker.RemoteImage(
  "android-demo-image",
  {
    name: "madhank93/android-demo",
  },
  {
    provider: remoteInstance,
    dependsOn: selenoidUiImage,
  }
);

// Start Selenoid container in remote instance
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
    dependsOn: [selenoidImage, selenoidBrowserJson],
  }
);

// Start Selenoid container in remote instance and attach it to selenoid
const selenoidUIContainer = new docker.Container(
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

const androidDemoTestContainer = new docker.Container(
  "android-demo-test-container",
  {
    image: androidDemoTestImage.name,
    name: "android-demo-test",
    networksAdvanced: [{ name: network.name }],
    command: ["gradle", "test"],
  },
  {
    provider: remoteInstance,
    dependsOn: [selenoidContainer, selenoidUIContainer],
  }
);

export const selenoidID = selenoidContainer.id;
export const androidContainerLogs = androidDemoTestContainer.logs;
