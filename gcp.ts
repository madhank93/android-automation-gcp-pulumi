import * as gcp from "@pulumi/gcp";

// Create a network
const network = new gcp.compute.Network("network");
const computeFirewall = new gcp.compute.Firewall("firewall", {
  network: network.id,
  allows: [
    {
      protocol: "tcp",
      ports: ["22"],
    },
  ],
});

// Create a Virtual Machine Instance
const computeInstance = new gcp.compute.Instance("instance", {
  machineType: "f1-micro",
  zone: "us-central1-a",
  bootDisk: { initializeParams: { image: "debian-cloud/debian-9" } },
  networkInterfaces: [
    {
      network: network.id,
      // accessConfigus must include a single empty config to request an ephemeral IP
      accessConfigs: [{}],
    },
  ],
  advancedMachineFeatures: { enableNestedVirtualization: true },
});

// Export the name and IP address of the Instance
export const instanceName = computeInstance.name;
