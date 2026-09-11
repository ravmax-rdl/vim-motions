import { type RouteConfig, index, route } from "@react-router/dev/routes";

const devOnly =
  process.env.NODE_ENV === "production" ? [] : [route("__conformance", "routes/conformance.tsx")];

export default [
  index("routes/home.tsx"),
  route("practice", "routes/practice.tsx"),
  ...devOnly,
] satisfies RouteConfig;
