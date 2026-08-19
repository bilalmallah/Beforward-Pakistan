import api from '../../lib/api';

export interface SearchResultItem {
  id: string;
  label: string;
  sublabel: string | null;
}

export interface SearchResults {
  customers: SearchResultItem[];
  tickets: SearchResultItem[];
  vehicles: SearchResultItem[];
}

export async function globalSearch(query: string) {
  const { data } = await api.get<SearchResults>('/search', { params: { q: query } });
  return data;
}
