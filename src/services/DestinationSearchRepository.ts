import {
  Destination,
  DestinationAutocompleteResponse,
  DestinationSearchItem,
} from '../types/destination';
import { searchInternalDestinations } from './destinationSearchService';

export interface IDestinationSearchRepository {
  autocomplete(
    query: string,
    language?: 'ko' | 'en',
    limit?: number,
    isImeComposing?: boolean,
    explicit?: boolean,
    signal?: AbortSignal
  ): Promise<DestinationAutocompleteResponse>;
  resolve(externalId: string, language?: 'ko' | 'en'): Promise<Destination>;
}

export class HybridDestinationSearchRepository implements IDestinationSearchRepository {
  private cache = new Map<string, DestinationAutocompleteResponse>();

  async autocomplete(
    query: string,
    language: 'ko' | 'en' = 'ko',
    limit: number = 8,
    isImeComposing: boolean = false,
    explicit: boolean = false,
    signal?: AbortSignal
  ): Promise<DestinationAutocompleteResponse> {
    const trimmed = query.trim();
    const cacheKey = `${language}:${limit}:${trimmed}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const endpoint = `/app-api/destinations/autocomplete?q=${encodeURIComponent(
        trimmed
      )}&language=${language}&limit=${limit}&countryHint=&providerVersion=v1`;

      const res = await fetch(endpoint, { signal });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: DestinationAutocompleteResponse = await res.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (err: any) {
      console.warn('[Repository Warning] API autocomplete failed, using internal client fallback:', err.message);

      // Client-side fallback using internal seed database
      const items = searchInternalDestinations(trimmed, limit, language);
      const fallbackResponse: DestinationAutocompleteResponse = {
        query: trimmed,
        status: items.length > 0 ? 'success' : 'empty',
        items,
        meta: {
          internalCount: items.length,
          externalCount: 0,
          cacheHit: true,
        },
      };

      return fallbackResponse;
    }
  }

  async resolve(externalId: string, language: 'ko' | 'en' = 'ko', pendingAlias?: string): Promise<Destination> {
    try {
      const res = await fetch('/app-api/destinations/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', externalId, language, pendingAlias }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'resolved' && data.destination) {
        // Invalidate/clear search cache upon successful destination upsert
        this.cache.clear();
        return data.destination;
      }
      throw new Error('Failed to resolve destination');
    } catch (err: any) {
      console.error('[Repository Error] Destination resolve failed:', err.message);
      throw err;
    }
  }
}

export const destinationSearchRepository = new HybridDestinationSearchRepository();
