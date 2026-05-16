type SignalEvent = "start" | "ping" | "hidden" | "pagehide";

const DEFAULT_ENDPOINT = "/_o/p.gif";
const ENV_ENDPOINT = import.meta.env.VITE_TRACKING_ENDPOINT;
const SIGNAL_ENDPOINT =
  typeof ENV_ENDPOINT === "string" && ENV_ENDPOINT.trim().length > 0
    ? ENV_ENDPOINT.trim()
    : DEFAULT_ENDPOINT;

function createSessionId() {
  const cryptoSource = globalThis.crypto;

  if (cryptoSource?.randomUUID) {
    return cryptoSource.randomUUID();
  }

  if (cryptoSource?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoSource.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function sendSignal(data: Record<string, string>, preferBeacon: boolean) {
  const body = new URLSearchParams(data);

  if (preferBeacon && typeof navigator.sendBeacon === "function") {
    if (navigator.sendBeacon(SIGNAL_ENDPOINT, body)) {
      return;
    }
  }

  const init: RequestInit = {
    method: "POST",
    body,
    keepalive: true,
    cache: "no-store",
    credentials: "omit",
  };

  if (SIGNAL_ENDPOINT.startsWith("/")) {
    init.mode = "same-origin";
  }

  void fetch(SIGNAL_ENDPOINT, init).catch(() => {});
}

export function startPageTelemetry() {
  const sid = createSessionId();
  const startedAt = Date.now();
  let lastDuration = -1;

  const duration = () => Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

  const emit = (event: SignalEvent, force = false) => {
    const durationSec = duration();

    if (!force && durationSec === lastDuration) {
      return;
    }

    lastDuration = durationSec;
    sendSignal(
      {
        sid,
        event,
        duration: String(durationSec),
        path: window.location.pathname || "/",
        t: String(Date.now()),
      },
      event !== "start",
    );
  };

  emit("start", true);

  const intervalId = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      emit("ping");
    }
  }, 5000);

  const handleVisibility = () => {
    emit(document.visibilityState === "hidden" ? "hidden" : "ping", true);
  };

  const handlePageHide = () => {
    emit("pagehide", true);
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handlePageHide);
  };
}
