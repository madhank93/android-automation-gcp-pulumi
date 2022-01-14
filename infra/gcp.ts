import * as gcp from "@pulumi/gcp";
import { remote, types } from "@pulumi/command";
import { Config } from "@pulumi/pulumi";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const config = new Config();
const publicKey = config.get("publicKey");

const privateKeyBase64 = config.get("privateKeyBase64");

const privateKey = privateKeyBase64
  ? Buffer.from(privateKeyBase64, "base64").toString("ascii")
  : fs.readFileSync(path.join(os.homedir(), ".ssh", "id_rsa")).toString("utf8");

const svcAct = new gcp.serviceaccount.Account("my-service-account", {
  accountId: "service-account",
  displayName: "Service account for Pulumi",
});

const svcKey = new gcp.serviceaccount.Key("my-service-key", {
  serviceAccountId: svcAct.name,
  publicKeyType: "TYPE_X509_PEM_FILE",
});

const address = new gcp.compute.Address("my-address", {
  region: "us-central1",
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
      network: "default",
      accessConfigs: [{ natIp: address.address }],
    },
  ],
  advancedMachineFeatures: { enableNestedVirtualization: true },
  serviceAccount: {
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    email: svcAct.email,
  },
  metadata: {
    "enable-oslogin": "false",
    "ssh-keys": `user:${publicKey}`,
  },
});

const connection: types.input.remote.ConnectionArgs = {
  host: address.address,
  user: "user",
  privateKey: privateKey,
};

const copyFile = new remote.CopyFile("docker-install-file", {
  connection,
  localPath: "./deploy.sh",
  remotePath: "deploy.sh",
});

const execCommand = new remote.Command(
  "exec-docker-shell",
  {
    connection: connection,
    create: "sh deploy.sh",
  },
  { dependsOn: copyFile }
);

// Export the name and IP address of the Instance
export const instanceName = computeInstance.name;
