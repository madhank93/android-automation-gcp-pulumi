import { local } from "@pulumi/command";

const random = new local.Command(
  "random",
  {
    create: "./deploy.sh",
  },
  {}
);

const response = random.stdout.apply((x) => console.log(x));

//response.apply((x: any) => x.url as string);

export const output = random.stdout;
