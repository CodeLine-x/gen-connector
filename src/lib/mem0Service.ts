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
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface SearchParams {
  query: string;
  metadata?: Record<string, unknown>;
  limit?: number;
}

interface SearchResult {
  memories: Memory[];
  total: number;
}

interface AddMemoryResponse {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
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
    data?: unknown
  ): Promise<unknown> {
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

    console.log(`🔍 Mem0 API Request: ${method} ${url}`);
    if (data) {
      console.log(`📤 Request body:`, JSON.stringify(data, null, 2));
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      // Try to get the error details from the response
      let errorDetails = "";
      try {
        const errorBody = await response.text();
        errorDetails = ` - ${errorBody}`;
      } catch (e) {
        // Ignore if we can't read the error body
      }

      throw new Error(
        `Mem0 API error: ${response.status} ${response.statusText}${errorDetails}`
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
    return this.makeRequest(
      "/v1/memories",
      "POST",
      memory
    ) as Promise<AddMemoryResponse>;
  }

  /**
   * Add multiple memories at once
   */
  async addMemories(
    memories: Omit<Memory, "id" | "created_at" | "updated_at">[]
  ): Promise<AddMemoryResponse[]> {
    return this.makeRequest("/v1/memories/batch", "POST", {
      memories,
    }) as Promise<AddMemoryResponse[]>;
  }

  /**
   * Get all memories for a specific entity
   */
  async getMemories(
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<Memory[]> {
    const params = new URLSearchParams();

    if (entityId) {
      params.append("entity_id", entityId);
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata.${key}`, String(value));
      });
    }

    // Add required pagination parameters if no entity filters
    if (!entityId && !metadata) {
      params.append("page", "1");
      params.append("page_size", "50");
    }

    return this.makeRequest(`/v1/memories?${params.toString()}`) as Promise<
      Memory[]
    >;
  }

  /**
   * Search memories using semantic search
   */
  async searchMemories(params: SearchParams): Promise<SearchResult> {
    // Use the main memories endpoint with search parameters
    const searchParams = new URLSearchParams();

    // Add search query if provided
    if (params.query) {
      searchParams.append("query", params.query);
    }

    // Add limit
    searchParams.append("limit", String(params.limit || 10));

    // Add metadata filters if provided
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        searchParams.append(`metadata.${key}`, String(value));
      });
    }

    // Add required pagination parameters if no entity filters
    if (!params.metadata || !params.metadata.entity_id) {
      searchParams.append("page", "1");
      searchParams.append("page_size", String(params.limit || 10));
    }

    const endpoint = `/v1/memories?${searchParams.toString()}`;

    try {
      // Try to get memories with search parameters
      const memories = (await this.makeRequest(endpoint, "GET")) as Memory[];

      return {
        memories: memories || [],
        total: memories?.length || 0,
      };
    } catch (error) {
      console.log("⚠️ Search with parameters failed, getting all memories");

      // Fallback: Get all memories and filter client-side
      const fallbackParams = new URLSearchParams();
      fallbackParams.append("page", "1");
      fallbackParams.append("page_size", "100"); // Get more for filtering

      const allMemories = (await this.makeRequest(
        `/v1/memories?${fallbackParams.toString()}`,
        "GET"
      )) as Memory[];

      // Simple text-based filtering
      let filteredMemories = allMemories || [];

      if (params.query) {
        const queryLower = params.query.toLowerCase();
        filteredMemories = filteredMemories.filter((memory) =>
          memory.text.toLowerCase().includes(queryLower)
        );
      }

      if (params.metadata) {
        filteredMemories = filteredMemories.filter((memory) => {
          if (!memory.metadata) return false;
          return Object.entries(params.metadata!).every(
            ([key, value]) => memory.metadata![key] === value
          );
        });
      }

      // Apply limit
      const limit = params.limit || 10;
      filteredMemories = filteredMemories.slice(0, limit);

      return {
        memories: filteredMemories,
        total: filteredMemories.length,
      };
    }
  }

  /**
   * Update an existing memory
   */
  async updateMemory(
    memoryId: string,
    updates: Partial<Memory>
  ): Promise<Memory> {
    return this.makeRequest(
      `/v1/memories/${memoryId}`,
      "PUT",
      updates
    ) as Promise<Memory>;
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    await this.makeRequest(`/v1/memories/${memoryId}`, "DELETE");
  }

  /**
   * Delete multiple memories
   */
  async deleteMemories(memoryIds: string[]): Promise<void> {
    await this.makeRequest("/v1/memories/batch", "DELETE", {
      memory_ids: memoryIds,
    });
  }

  /**
   * Get project details
   */
  async getProject(): Promise<unknown> {
    return this.makeRequest("/v1/projects");
  }

  /**
   * Create a new project
   */
  async createProject(name: string, description?: string): Promise<unknown> {
    return this.makeRequest("/v1/projects", "POST", { name, description });
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
  }): Promise<unknown> {
    return this.makeRequest("/v1/projects", "PUT", updates);
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
