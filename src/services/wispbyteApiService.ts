import { WispbyteApiEndpointDoc, WispbyteApiServerAttributes } from "../types/wispbyteApi.js";

export class WispbyteApiService {
  private static instance: WispbyteApiService;

  private serverAttributes: WispbyteApiServerAttributes = {
    server_owner: true,
    identifier: "c8f2a1b9",
    uuid: "c8f2a1b9-7b3c-491a-bc01-e2a4f91048b2",
    name: "AegisMod Discord Bot (Node.js 20)",
    node: "wisp-sg-node01.wispbyte.net",
    sftp_details: {
      ip: "aegisbot.wispbyte.app",
      port: 2022,
    },
    description: "Production AegisMod Discord Hybrid AI Moderation Bot running on Wispbyte Pterodactyl hosting.",
    limits: {
      memory: 512,
      swap: 0,
      disk: 1024,
      io: 500,
      cpu: 100,
      threads: null,
    },
    feature_limits: {
      databases: 1,
      allocations: 2,
      backups: 3,
    },
    is_suspended: false,
    is_installing: false,
    relationships: {
      allocations: {
        object: "list",
        data: [
          {
            object: "server_allocation",
            attributes: {
              id: 10144,
              ip: "aegisbot.wispbyte.app",
              ip_alias: "aegisbot.wispbyte.app",
              port: 10144,
              notes: "Primary Webpage & Bot Gateway HTTP/WS Port",
              is_default: true,
            },
          },
          {
            object: "server_allocation",
            attributes: {
              id: 10145,
              ip: "aegisbot.wispbyte.app",
              ip_alias: "aegisbot.wispbyte.app",
              port: 10145,
              notes: "Secondary Webhook Ingestion Port",
              is_default: false,
            },
          },
        ],
      },
      variables: {
        object: "list",
        data: [
          {
            object: "egg_variable",
            attributes: {
              name: "Webpage & API Port",
              description: "The primary HTTP/WS port for AegisMod dashboard and webhooks",
              env_variable: "PORT",
              default_value: "10144",
              server_value: "10144",
              is_editable: true,
              rules: "required|numeric|between:1024,65535",
            },
          },
          {
            object: "egg_variable",
            attributes: {
              name: "Wispbyte Subdomain",
              description: "Assigned Wispbyte sub-allocation domain",
              env_variable: "SUBDOMAIN",
              default_value: "aegisbot.wispbyte.app",
              server_value: "aegisbot.wispbyte.app",
              is_editable: false,
              rules: "required|string",
            },
          },
          {
            object: "egg_variable",
            attributes: {
              name: "Moderation Policy Preset",
              description: "AI moderation policy profile",
              env_variable: "MODERATION_POLICY_LEVEL",
              default_value: "STRICT_TEEN",
              server_value: "STRICT_TEEN",
              is_editable: true,
              rules: "required|string|in:STRICT_TEEN,HIGH_ALERT,STANDARD",
            },
          },
        ],
      },
    },
  };

  public static getInstance(): WispbyteApiService {
    if (!WispbyteApiService.instance) {
      WispbyteApiService.instance = new WispbyteApiService();
    }
    return WispbyteApiService.instance;
  }

  public getServerDetails(customRam?: number, customPolicy?: string): { object: string; attributes: WispbyteApiServerAttributes } {
    const copy = JSON.parse(JSON.stringify(this.serverAttributes));
    if (customRam) {
      copy.limits.memory = customRam;
    }
    if (customPolicy) {
      const varEntry = copy.relationships.variables.data.find(
        (v: any) => v.attributes.env_variable === "MODERATION_POLICY_LEVEL"
      );
      if (varEntry) varEntry.attributes.server_value = customPolicy;
    }
    return {
      object: "server",
      attributes: copy,
    };
  }

  public getWebsocketToken(): { data: { token: string; socket: string } } {
    const token = "ptlc_jwt_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return {
      data: {
        token,
        socket: "wss://wisp-sg-node01.wispbyte.net:8080/api/servers/c8f2a1b9-7b3c/ws",
      },
    };
  }

  public getDocumentation(): WispbyteApiEndpointDoc[] {
    return [
      {
        id: "get-server",
        method: "GET",
        path: "/api/client/servers/c8f2a1b9",
        title: "Get Server Details",
        category: "Server Management",
        description: "Retrieves complete metadata, SFTP credentials, RAM/CPU limits, and assigned allocation for AegisMod.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        responseExample: {
          object: "server",
          attributes: {
            identifier: "c8f2a1b9",
            name: "AegisMod Discord Bot (Node.js 20)",
            node: "wisp-sg-node01.wispbyte.net",
            allocation: "aegisbot.wispbyte.app:10144",
            limits: { memory: 512, cpu: 100, disk: 1024 },
          },
        },
        curlSnippet: `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Accept: application/json"`,
        jsSnippet: `const response = await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9", {
  headers: {
    "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY,
    "Accept": "application/json"
  }
});
const { attributes } = await response.json();
console.log("Connected to:", attributes.name, "on port", attributes.relationships.allocations.data[0].attributes.port);`,
      },
      {
        id: "get-resources",
        method: "GET",
        path: "/api/client/servers/c8f2a1b9/resources",
        title: "Get Live Resource Utilization",
        category: "Power & State",
        description: "Fetches real-time CPU, RAM, Disk, and Network telemetry directly from the Pterodactyl daemon.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          Accept: "application/json",
        },
        responseExample: {
          object: "stats",
          attributes: {
            current_state: "running",
            is_suspended: false,
            resources: {
              memory_bytes: 184549376,
              cpu_absolute: 8.42,
              disk_bytes: 52428800,
              network_rx_bytes: 49102410,
              network_tx_bytes: 19482910,
              uptime: 397420,
            },
          },
        },
        curlSnippet: `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/resources" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Accept: application/json"`,
        jsSnippet: `const res = await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9/resources", {
  headers: { "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY }
});
const { attributes } = await res.json();
console.log(\`State: \${attributes.current_state}, CPU: \${attributes.resources.cpu_absolute}%\`);`,
      },
      {
        id: "post-power",
        method: "POST",
        path: "/api/client/servers/c8f2a1b9/power",
        title: "Send Power Signal",
        category: "Power & State",
        description: "Sends power actions (start, stop, restart, kill) to the server container.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          "Content-Type": "application/json",
        },
        requestBodyExample: JSON.stringify({ signal: "restart" }, null, 2),
        responseExample: {
          success: true,
          action: "restart",
          timestamp: "2026-09-23T12:28:19.000Z",
        },
        curlSnippet: `curl -X POST "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/power" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"signal":"restart"}'`,
        jsSnippet: `await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9/power", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ signal: "restart" })
});`,
      },
      {
        id: "post-command",
        method: "POST",
        path: "/api/client/servers/c8f2a1b9/command",
        title: "Send Console Command",
        category: "Console & Commands",
        description: "Sends a command directly to the Node.js standard input / bot console.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          "Content-Type": "application/json",
        },
        requestBodyExample: JSON.stringify({ command: "status" }, null, 2),
        responseExample: {
          success: true,
          command: "status",
        },
        curlSnippet: `curl -X POST "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/command" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"command":"status"}'`,
        jsSnippet: `await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9/command", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ command: "status" })
});`,
      },
      {
        id: "get-websocket",
        method: "GET",
        path: "/api/client/servers/c8f2a1b9/websocket",
        title: "Get Console WebSocket Credentials",
        category: "Websocket Telemetry",
        description: "Generates an ephemeral JWT token and WSS endpoint to stream real-time logs and metrics.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          Accept: "application/json",
        },
        responseExample: {
          data: {
            token: "eyJhbGciOi...",
            socket: "wss://wisp-sg-node01.wispbyte.net:8080/api/servers/c8f2a1b9-7b3c/ws",
          },
        },
        curlSnippet: `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/websocket" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Accept: application/json"`,
        jsSnippet: `const { data } = await (await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9/websocket", {
  headers: { "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY }
})).json();

const ws = new WebSocket(data.socket);
ws.onopen = () => {
  ws.send(JSON.stringify({ event: "auth", args: [data.token] }));
};
ws.onmessage = (msg) => console.log("[Console WS]:", JSON.parse(msg.data));`,
      },
      {
        id: "get-allocations",
        method: "GET",
        path: "/api/client/servers/c8f2a1b9/network/allocations",
        title: "Get Network Allocations",
        category: "Allocations & Network",
        description: "Lists assigned domain aliases, webpage port 10144, and webhook listener bindings.",
        authRequired: true,
        headers: {
          Authorization: "Bearer ptlc_...",
          Accept: "application/json",
        },
        responseExample: {
          object: "list",
          data: [
            {
              object: "server_allocation",
              attributes: {
                id: 10144,
                ip: "aegisbot.wispbyte.app",
                ip_alias: "aegisbot.wispbyte.app",
                port: 10144,
                notes: "Primary Webpage & Bot Gateway HTTP/WS Port",
                is_default: true,
              },
            },
          ],
        },
        curlSnippet: `curl "https://panel.wispbyte.net/api/client/servers/c8f2a1b9/network/allocations" \\
  -H "Authorization: Bearer \${WISPBYTE_API_KEY}" \\
  -H "Accept: application/json"`,
        jsSnippet: `const { data } = await (await fetch("https://panel.wispbyte.net/api/client/servers/c8f2a1b9/network/allocations", {
  headers: { "Authorization": "Bearer " + process.env.WISPBYTE_API_KEY }
})).json();
console.log("Primary allocation:", data[0].attributes.ip_alias + ":" + data[0].attributes.port);`,
      },
    ];
  }
}

export const wispbyteApiService = WispbyteApiService.getInstance();
