export interface WispbyteApiServerAttributes {
  server_owner: boolean;
  identifier: string;
  uuid: string;
  name: string;
  node: string;
  sftp_details: {
    ip: string;
    port: number;
  };
  description: string;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
    threads: string | null;
  };
  feature_limits: {
    databases: number;
    allocations: number;
    backups: number;
  };
  is_suspended: boolean;
  is_installing: boolean;
  relationships: {
    allocations: {
      object: string;
      data: Array<{
        object: string;
        attributes: {
          id: number;
          ip: string;
          ip_alias: string;
          port: number;
          notes: string | null;
          is_default: boolean;
        };
      }>;
    };
    variables: {
      object: string;
      data: Array<{
        object: string;
        attributes: {
          name: string;
          description: string;
          env_variable: string;
          default_value: string;
          server_value: string;
          is_editable: boolean;
          rules: string;
        };
      }>;
    };
  };
}

export interface WispbyteApiEndpointDoc {
  id: string;
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  title: string;
  category: "Server Management" | "Power & State" | "Console & Commands" | "Websocket Telemetry" | "Allocations & Network" | "Files & Backups";
  description: string;
  authRequired: boolean;
  headers: Record<string, string>;
  requestBodyExample?: string;
  responseExample: any;
  curlSnippet: string;
  jsSnippet: string;
}

export interface WispbyteApiTestRequest {
  endpoint: string;
  method: "GET" | "POST";
  apiKey?: string;
  panelUrl?: string;
  serverId?: string;
  body?: any;
}

export interface WispbyteApiTestResponse {
  success: boolean;
  statusCode: number;
  durationMs: number;
  headers: Record<string, string>;
  data: any;
  curlCommand: string;
  timestamp: string;
}
