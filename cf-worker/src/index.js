export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // WebSocket entrypoint: forward to Durable Object Lobby
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 400 });
      }
      const id = env.LOBBY.idFromName("global-lobby");
      const stub = env.LOBBY.get(id);
      return await stub.fetch(request);
    }

    // Health / basic info
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "dog-field-worker" }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

export class Lobby {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.waiting = null; // one waiting socket
    this.pairs = new Set(); // track active pairs
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/ws") {
      return new Response("Not Found", { status: 404 });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    this.#attachHandlers(server);
    this.#onConnect(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  #attachHandlers(ws) {
    ws.addEventListener("message", (evt) => {
      let data;
      try {
        data = JSON.parse(evt.data);
      } catch {
        data = { type: "text", payload: String(evt.data) };
      }
      // Relay to partner if paired
      if (ws.partner && ws.partner.readyState === 1) {
        try {
          ws.partner.send(JSON.stringify({ type: "relay", from: ws.id, data }));
        } catch {}
      }
    });

    ws.addEventListener("close", () => {
      // Remove from waiting or pairs
      if (this.waiting === ws) {
        this.waiting = null;
      }
      if (ws.partner) {
        const partner = ws.partner;
        ws.partner = null;
        if (this.pairs.has(ws)) this.pairs.delete(ws);
        if (this.pairs.has(partner)) this.pairs.delete(partner);
        try {
          partner.send(JSON.stringify({ type: "partner_left" }));
          partner.close();
        } catch {}
      }
    });

    // Simple ping interval to keep connections alive
    const interval = setInterval(() => {
      try {
        ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
      } catch {
        clearInterval(interval);
      }
    }, 25000);

    ws.id = crypto.randomUUID();
  }

  #onConnect(ws) {
    // Pair logic: if someone is waiting, pair them; else set as waiting
    if (this.waiting && this.waiting !== ws) {
      const a = this.waiting;
      const b = ws;
      this.waiting = null;
      a.partner = b;
      b.partner = a;
      this.pairs.add(a);
      this.pairs.add(b);
      try {
        a.send(JSON.stringify({ type: "paired", you: a.id, partner: b.id }));
        b.send(JSON.stringify({ type: "paired", you: b.id, partner: a.id }));
      } catch {}
    } else {
      this.waiting = ws;
      try {
        ws.send(JSON.stringify({ type: "waiting" }));
      } catch {}
    }
  }
}
