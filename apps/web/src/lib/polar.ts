import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.NEXT_PUBLIC_POLAR_ACCESS_TOKEN ?? "",
  server: process.env.NODE_ENV === "development" ? "sandbox" : undefined,
});

export default polar;