export interface SendMessageResponse {
  key: { remoteJid: string; fromMe: boolean; id: string };
  message: Record<string, unknown>;
  messageTimestamp: string;
  status: string;
}

export type SendMediaResponse = SendMessageResponse;

export interface SendStatusResponse {
  status: string;
  message: string;
}

export interface InstanceStatusResponse {
  instance: { instanceName: string; state: string };
}

export interface InstanceInfo {
  instanceName: string;
  connectionStatus: string;
  ownerJid?: string;
  phoneNumber?: string;
  qrcode?: { base64?: string; code?: string };
}

export interface WaMessage {
  key: { remoteJid: string; fromMe: boolean; id: string };
  message: Record<string, unknown>;
  messageTimestamp: string | number;
  pushName?: string;
}

export interface FetchMessagesResponse {
  messages: WaMessage[];
}

export interface StatusContent {
  type: "text" | "image" | "video" | "audio";
  content: string;
  caption?: string;
  backgroundColor?: string;
  statusJidList?: string[];
}

export interface WaChat {
  id: string;
  name?: string;
  lastMessage?: WaMessage;
  unreadCount?: number;
}

class EvolutionAPI {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, method = "GET", body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", apikey: this.apiKey },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Evolution API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async sendMessage(instanceName: string, number: string, text: string): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(`/message/sendText/${instanceName}`, "POST", { number, text });
  }

  async sendMedia(instanceName: string, number: string, mediaUrl: string, caption?: string, mediaType: "image" | "video" | "audio" | "document" = "image"): Promise<SendMediaResponse> {
    return this.request<SendMediaResponse>(`/message/sendMedia/${instanceName}`, "POST", {
      number, mediatype: mediaType, media: mediaUrl, caption,
    });
  }

  async sendStatus(instanceName: string, content: StatusContent): Promise<SendStatusResponse> {
    return this.request<SendStatusResponse>(`/message/sendStatus/${instanceName}`, "POST", content);
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatusResponse> {
    return this.request<InstanceStatusResponse>(`/instance/connectionState/${instanceName}`);
  }

  async getInstanceInfo(instanceName: string): Promise<InstanceInfo[]> {
    return this.request<InstanceInfo[]>(`/instance/fetchInstances?instanceName=${instanceName}`);
  }

  async connectInstance(instanceName: string): Promise<{ qrcode?: { base64?: string; code?: string } }> {
    return this.request(`/instance/connect/${instanceName}`);
  }

  async getQRCode(instanceName: string): Promise<{ qrcode?: { base64?: string; code?: string } }> {
    return this.request(`/instance/qrcode/${instanceName}?image=true`);
  }

  async configureWebhook(instanceName: string, url: string, events: string[]): Promise<unknown> {
    return this.request(`/webhook/set/${instanceName}`, "POST", {
      url,
      webhook_by_events: true,
      webhook_base64: false,
      events,
    });
  }

  async getChats(instanceName: string): Promise<WaChat[]> {
    return this.request<WaChat[]>(`/chat/findChats/${instanceName}`, "POST", {});
  }

  async fetchMessages(instanceName: string, remoteJid: string, count = 50): Promise<FetchMessagesResponse> {
    return this.request<FetchMessagesResponse>(`/chat/findMessages/${instanceName}`, "POST", {
      remoteJid, limit: count,
    });
  }

  async markAsRead(instanceName: string, remoteJid: string, messageIds: string[]): Promise<unknown> {
    return this.request(`/chat/markMessageAsRead/${instanceName}`, "POST", {
      readMessages: messageIds.map((id) => ({ id, remoteJid, fromMe: false })),
    });
  }
}

let _client: EvolutionAPI | null = null;

export function getEvolutionClient(): EvolutionAPI | null {
  const baseURL = process.env.EVOLUTION_API_BASE;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseURL || !apiKey) return null;
  if (!_client) _client = new EvolutionAPI(baseURL, apiKey);
  return _client;
}

export const EVOLUTION_INSTANCE = () => process.env.EVOLUTION_INSTANCE_NAME ?? "codigobase";
