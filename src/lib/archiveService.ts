export interface ArchiveImage {
  id: string;
  title: string;
  description: string;
  url: string;
  date?: string;
  location?: string;
  source: string;
  metadata?: any;
}

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  location?: string;
  keywords?: string[];
  contentType?: "photograph" | "document" | "newspaper" | "all";
}

class SingaporeArchiveService {
  private baseUrl = "https://www.nas.gov.sg/archivesonline";

  /**
   * Extract time periods, locations, and events from conversation text
   */
  extractContext(conversationText: string): {
    timePeriods: string[];
    locations: string[];
    events: string[];
    keywords: string[];
  } {
    const lowerText = conversationText.toLowerCase();

    // Extract time periods (decades, years, eras)
    const timePatterns = [
      /\b(19\d{2}|20\d{2})\b/g, // Years
      /\b(19\d0s|20\d0s)\b/g, // Decades
      /\b(war|post-war|pre-war|colonial|independence)\b/g, // Historical periods
    ];

    const timePeriods = timePatterns
      .flatMap((pattern) => lowerText.match(pattern) || [])
      .filter((value, index, self) => self.indexOf(value) === index);

    // Extract locations
    const locationKeywords = [
      "singapore",
      "malaya",
      "malaysia",
      "china",
      "india",
      "japan",
      "kampong",
      "chinatown",
      "little india",
      "orchard",
      "marina bay",
      "sentosa",
      "jurong",
      "woodlands",
      "tampines",
      "bedok",
    ];

    const locations = locationKeywords
      .filter((keyword) => lowerText.includes(keyword))
      .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1));

    // Extract events and activities
    const eventKeywords = [
      "wedding",
      "birth",
      "school",
      "work",
      "factory",
      "shop",
      "market",
      "festival",
      "celebration",
      "holiday",
      "travel",
      "migration",
      "war",
      "bombing",
      "occupation",
      "independence",
      "merdeka",
    ];

    const events = eventKeywords
      .filter((keyword) => lowerText.includes(keyword))
      .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1));

    // Extract general keywords
    const generalKeywords = [
      "family",
      "children",
      "parents",
      "grandparents",
      "siblings",
      "food",
      "cooking",
      "eating",
      "restaurant",
      "hawker",
      "transport",
      "bus",
      "train",
      "car",
      "bicycle",
      "clothes",
      "fashion",
      "dress",
      "uniform",
      "house",
      "home",
      "flat",
      "hdb",
      "kampong",
    ];

    const keywords = generalKeywords
      .filter((keyword) => lowerText.includes(keyword))
      .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1));

    return {
      timePeriods,
      locations,
      events,
      keywords: [...keywords, ...events, ...locations],
    };
  }

  /**
   * Search Singapore National Archives
   * Note: This is a placeholder implementation
   * In reality, you'd need to use their actual API or web scraping
   */
  async searchArchives(
    query: string,
    filters?: SearchFilters
  ): Promise<ArchiveImage[]> {
    // This is a mock implementation
    // In a real implementation, you would:
    // 1. Use the National Archives API if available
    // 2. Or implement web scraping of their search interface
    // 3. Or use a third-party service that indexes their content

    const mockResults: ArchiveImage[] = [
      {
        id: "1",
        title: "Singapore Street Scene, 1960s",
        description:
          "A bustling street in Singapore during the 1960s showing traditional shophouses and street vendors.",
        url: "https://example.com/archive1.jpg",
        date: "1965",
        location: "Chinatown, Singapore",
        source: "National Archives Singapore",
        metadata: {
          photographer: "Unknown",
          collection: "Street Life",
          tags: ["street", "shophouses", "vendors", "1960s"],
        },
      },
      {
        id: "2",
        title: "Family Portrait, 1970s",
        description:
          "A family gathering in traditional Singapore home during the 1970s.",
        url: "https://example.com/archive2.jpg",
        date: "1972",
        location: "Singapore",
        source: "National Archives Singapore",
        metadata: {
          photographer: "Unknown",
          collection: "Family Life",
          tags: ["family", "portrait", "home", "1970s"],
        },
      },
    ];

    // Filter results based on query and filters
    let filteredResults = mockResults;

    if (filters?.dateRange) {
      filteredResults = filteredResults.filter((image) => {
        if (!image.date) return true;
        const imageYear = parseInt(image.date);
        const startYear = parseInt(filters.dateRange!.start);
        const endYear = parseInt(filters.dateRange!.end);
        return imageYear >= startYear && imageYear <= endYear;
      });
    }

    if (filters?.location) {
      filteredResults = filteredResults.filter((image) =>
        image.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.keywords && filters.keywords.length > 0) {
      filteredResults = filteredResults.filter((image) =>
        filters.keywords!.some(
          (keyword) =>
            image.title.toLowerCase().includes(keyword.toLowerCase()) ||
            image.description.toLowerCase().includes(keyword.toLowerCase()) ||
            image.metadata?.tags?.some((tag: string) =>
              tag.toLowerCase().includes(keyword.toLowerCase())
            )
        )
      );
    }

    return filteredResults;
  }

  /**
   * Generate search query from conversation context
   */
  generateSearchQuery(context: ReturnType<typeof this.extractContext>): string {
    const queryParts: string[] = [];

    if (context.timePeriods.length > 0) {
      queryParts.push(context.timePeriods.join(" OR "));
    }

    if (context.locations.length > 0) {
      queryParts.push(context.locations.join(" OR "));
    }

    if (context.events.length > 0) {
      queryParts.push(context.events.join(" OR "));
    }

    if (context.keywords.length > 0) {
      queryParts.push(context.keywords.slice(0, 5).join(" OR "));
    }

    return queryParts.join(" AND ");
  }

  /**
   * Get relevant images based on conversation
   */
  async getRelevantImages(conversationText: string): Promise<ArchiveImage[]> {
    const context = this.extractContext(conversationText);
    const searchQuery = this.generateSearchQuery(context);

    if (!searchQuery.trim()) {
      return [];
    }

    const filters: SearchFilters = {
      dateRange:
        context.timePeriods.length > 0
          ? {
              start: this.extractEarliestYear(context.timePeriods),
              end: this.extractLatestYear(context.timePeriods),
            }
          : undefined,
      location: context.locations[0],
      keywords: context.keywords.slice(0, 10),
    };

    return await this.searchArchives(searchQuery, filters);
  }

  private extractEarliestYear(timePeriods: string[]): string {
    const years = timePeriods
      .map((period) => {
        const match = period.match(/\b(19\d{2}|20\d{2})\b/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((year) => year !== null) as number[];

    if (years.length === 0) return "1900";
    return Math.min(...years).toString();
  }

  private extractLatestYear(timePeriods: string[]): string {
    const years = timePeriods
      .map((period) => {
        const match = period.match(/\b(19\d{2}|20\d{2})\b/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((year) => year !== null) as number[];

    if (years.length === 0) return "2024";
    return Math.max(...years).toString();
  }
}

export const archiveService = new SingaporeArchiveService();
