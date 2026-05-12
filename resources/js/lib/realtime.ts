import Echo, { type EchoOptions } from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

const FALLBACK_REVERB_KEY = "local";
const FALLBACK_REVERB_PORT = 8080;

const resolveRealtimeHost = () => {
  const configuredHost = import.meta.env.VITE_REVERB_HOST;

  if (typeof window === "undefined") {
    return configuredHost || "127.0.0.1";
  }

  return !configuredHost || ["localhost", "127.0.0.1"].includes(configuredHost)
    ? window.location.hostname
    : configuredHost;
};

const resolveRealtimePort = () => {
  const port = Number(import.meta.env.VITE_REVERB_PORT || FALLBACK_REVERB_PORT);

  return Number.isFinite(port) ? port : FALLBACK_REVERB_PORT;
};

export const getRealtimeEchoOptions = (): EchoOptions<"reverb"> => {
  const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";

  return {
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || FALLBACK_REVERB_KEY,
    wsHost: resolveRealtimeHost(),
    wsPort: resolveRealtimePort(),
    wssPort: resolveRealtimePort(),
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    Pusher,
  };
};

export const createRealtimeEcho = () => {
  window.Pusher = Pusher;

  return new Echo(getRealtimeEchoOptions());
};
