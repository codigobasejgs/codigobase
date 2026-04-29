interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: Record<string, unknown>;
  messageTimestamp: string;
  status: string;
}

type SendMediaResponse = SendMessageResponse

interface SendStatusResponse {
  status: string;
  message: string;
}

interface InstanceStatusResponse {
  instance: {
    instanceName: string;
    state: string;
  };
}

interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: Record<string, unknown>;
  messageTimestamp: string;
}

interface FetchMessagesResponse {
  messages: Message[];
}

interface StatusContent {
  type: "text" | "image" | "video" | "audio";
  content: string;
  caption?: string;
  statusJidList?: string[];
}

class EvolutionAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.EVOLUTION_API_BASE || "";
    this.apiKey = process.env.EVOLUTION_API_KEY || "";

    if (!this.baseURL || !this.apiKey) {
      throw new Error(
        "EVOLUTION_API_BASE and EVOLUTION_API_KEY must be set in environment variables"
      );
    }
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Evolution API error: ${response.status} - ${error}`
      );
    }

    return response.json();
  }

  async sendMessage(
    instanceName: string,
    number: string,
    text: string
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      `/message/sendText/${instanceName}`,
      "POST",
      {
        number,
        text,
      }
    );
  }

  async sendMedia(
    instanceName: string,
    number: string,
    mediaUrl: string,
    caption?: string,
    mediaType: "image" | "video" | "audio" | "document" = "image"
  ): Promise<SendMediaResponse> {
    return this.request<SendMediaResponse>(
      `/message/sendMedia/${instanceName}`,
      "POST",
      {
        number,
        mediatype: mediaType,
        media: mediaUrl,
        caption,
      }
    );
  }

  async sendStatus(
    instanceName: string,
    content: StatusContent
  ): Promise<SendStatusResponse> {
    return this.request<SendStatusResponse>(
      `/message/sendStatus/${instanceName}`,
      "POST",
      content
    );
  }

  async getInstanceStatus(
    instanceName: string
  ): Promise<InstanceStatusResponse> {
    return this.request<InstanceStatusResponse>(
      `/instance/connectionState/${instanceName}`
    );
  }

  async fetchMessages(
    instanceName: string,
    remoteJid: string,
    count: number = 50
  ): Promise<FetchMessagesResponse> {
    return this.request<FetchMessagesResponse>(
      `/chat/findMessages/${instanceName}`,
      "POST",
      {
        remoteJid,
        limit: count,
      }
    );
  }
}

export const evolutionAPI = new EvolutionAPI();
