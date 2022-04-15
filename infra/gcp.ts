import * as gcp from "@pulumi/gcp";
import { remote, types } from "@pulumi/command";
import { interpolate } from "@pulumi/pulumi";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const getKey = (filename: string) =>
  fs
    .readFileSync(path.join(os.homedir(), ".ssh", filename))
    .toString("utf-8")
    .trim();

const publicKey = getKey("id_rsa.pub");
const privateKey = getKey("id_rsa");

// Create service account
const svcAct = new gcp.serviceaccount.Account("my-service-account", {
  accountId: "service-account",
  displayName: "Service account for Pulumi",
});

new gcp.serviceaccount.Key("my-service-key", {
  serviceAccountId: svcAct.name,
  publicKeyType: "TYPE_X509_PEM_FILE",
});

const address = new gcp.compute.Address("my-address", {
  region: "us-central1",
});

// Create a network
const network = new gcp.compute.Network("network");
new gcp.compute.Firewall("firewall", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["22", "8080"], // 22 - enable ssh and 8080 - live execution through selenoid ui
    },
  ],
});

// Create a Virtual Machine Instance
const computeInstance = new gcp.compute.Instance("instance", {
  machineType: "n2-standard-2",
  zone: "us-central1-a",
  bootDisk: {
    initializeParams: {
      image: "ubuntu-os-cloud/ubuntu-1804-lts",
      size: 20,
    },
  },
  networkInterfaces: [
    {
      network: network.id,
      accessConfigs: [{ natIp: address.address }],
    },
  ],
  advancedMachineFeatures: { enableNestedVirtualization: true },
  serviceAccount: {
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    email: svcAct.email,
  },
  metadata: {
    "ssh-keys": interpolate`madhankumaravelu93:${publicKey}`,
  },
});

// Set up a connection to the remote instance
const connection: types.input.remote.ConnectionArgs = {
  host: address.address,
  user: "madhankumaravelu93",
  privateKey: privateKey,
};

// Copy shell script to the remote instance
const copyFile = new remote.CopyFile(
  "copy-shell-script",
  {
    connection,
    localPath: "deploy.sh",
    remotePath: "deploy.sh",
  },
  { dependsOn: computeInstance }
);

// Copy selenoid browser json config to remote instance
const copyBrowserJsonFile = new remote.CopyFile(
  "copy-browser-json",
  {
    connection,
    localPath: "../src/resource/selenoid/browsers.json",
    remotePath: "browsers.json",
  },
  { dependsOn: computeInstance }
);

// Execute the copied shell script to install docker in remote instance
const execCommand = new remote.Command(
  "exec-shell-script",
  {
    connection,
    create: "sh deploy.sh",
  },
  { dependsOn: copyFile }
);

// Export the IP address of the Instance
export const externalIP = address.address;

export const dockerInstallation = execCommand;

export const selenoidBrowserJson = copyBrowserJsonFile;
