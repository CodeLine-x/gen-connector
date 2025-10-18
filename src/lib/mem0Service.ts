// Mem0 Service - REST API client for memory management
// Based on: https://docs.mem0.ai/api-reference

interface Mem0Config {
  apiKey: string;
  baseUrl?: string;
  orgId?: string;
  projectId?: string;
}

interface Memory {
  id?: string;
  text: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface SearchParams {
  query: string;
  metadata?: Record<string, any>;
  limit?: number;
}

interface SearchResult {
  memories: Memory[];
  total: number;
}

interface AddMemoryResponse {
  id: string;
  text: string;
  metadata: Record<string, any>;
  created_at: string;
}

class Mem0Service {
  private apiKey: string;
  private baseUrl: string;
  private orgId?: string;
  private projectId?: string;

  constructor(config: Mem0Config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.mem0.ai";
    this.orgId = config.orgId;
    this.projectId = config.projectId;
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Token ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Add organization and project headers if provided
    if (this.orgId) {
      headers["X-Org-ID"] = this.orgId;
    }
    if (this.projectId) {
      headers["X-Project-ID"] = this.projectId;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `Mem0 API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Add a new memory
   */
  async addMemory(
    memory: Omit<Memory, "id" | "created_at" | "updated_at">
  ): Promise<AddMemoryResponse> {
    return this.makeRequest("/v1/memories/", "POST", memory);
  }

  /**
   * Add multiple memories at once
   */
  async addMemories(
    memories: Omit<Memory, "id" | "created_at" | "updated_at">[]
  ): Promise<AddMemoryResponse[]> {
    return this.makeRequest("/v1/memories/batch/", "POST", { memories });
  }

  /**
   * Get all memories for a specific entity
   */
  async getMemories(
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<Memory[]> {
    const params = new URLSearchParams();
    params.append("entity_id", entityId);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata.${key}`, String(value));
      });
    }

    return this.makeRequest(`/v1/memories/?${params.toString()}`);
  }

  /**
   * Search memories using semantic search
   */
  async searchMemories(params: SearchParams): Promise<SearchResult> {
    return this.makeRequest("/v1/memories/search/", "POST", params);
  }

  /**
   * Update an existing memory
   */
  async updateMemory(
    memoryId: string,
    updates: Partial<Memory>
  ): Promise<Memory> {
    return this.makeRequest(`/v1/memories/${memoryId}/`, "PUT", updates);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    await this.makeRequest(`/v1/memories/${memoryId}/`, "DELETE");
  }

  /**
   * Delete multiple memories
   */
  async deleteMemories(memoryIds: string[]): Promise<void> {
    await this.makeRequest("/v1/memories/batch/", "DELETE", {
      memory_ids: memoryIds,
    });
  }

  /**
   * Get project details
   */
  async getProject(): Promise<any> {
    return this.makeRequest("/v1/projects/");
  }

  /**
   * Create a new project
   */
  async createProject(name: string, description?: string): Promise<any> {
    return this.makeRequest("/v1/projects/", "POST", { name, description });
  }

  /**
   * Update project settings
   */
  async updateProject(updates: {
    name?: string;
    description?: string;
    custom_instructions?: string;
    custom_categories?: Array<{ [key: string]: string }>;
    enable_graph?: boolean;
  }): Promise<any> {
    return this.makeRequest("/v1/projects/", "PUT", updates);
  }
}

// Create and export a singleton instance
const createMem0Service = (): Mem0Service => {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    throw new Error("MEM0_API_KEY is not configured in environment variables");
  }

  return new Mem0Service({
    apiKey,
    orgId: process.env.MEM0_ORG_ID,
    projectId: process.env.MEM0_PROJECT_ID,
  });
};

export { Mem0Service, createMem0Service };
export type { Memory, SearchParams, SearchResult, AddMemoryResponse };
