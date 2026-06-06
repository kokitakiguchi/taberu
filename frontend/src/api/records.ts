import axios from 'axios';
import type { AllergensStats, CaloriesStats, FoodRecord, NutrientsStats, RecordsResponse, UpdateRecordPayload } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
});

export async function createRecord(form: FormData): Promise<FoodRecord> {
  const { data } = await api.post<FoodRecord>('/api/records', form);
  return data;
}

export async function fetchRecords(date?: string): Promise<RecordsResponse> {
  const params = date ? { date } : {};
  const { data } = await api.get<RecordsResponse>('/api/records', { params });
  return data;
}

export async function updateRecord(id: number, payload: UpdateRecordPayload): Promise<FoodRecord> {
  const { data } = await api.put<FoodRecord>(`/api/records/${id}`, payload);
  return data;
}

export async function deleteRecord(id: number): Promise<void> {
  await api.delete(`/api/records/${id}`);
}

export async function fetchCaloriesStats(period: 'week' | 'month'): Promise<CaloriesStats> {
  const { data } = await api.get<CaloriesStats>('/api/stats/calories', { params: { period } });
  return data;
}

export async function fetchNutrientsStats(date: string): Promise<NutrientsStats> {
  const { data } = await api.get<NutrientsStats>('/api/stats/nutrients', { params: { date } });
  return data;
}

export async function fetchAllergensStats(period: 'week' | 'month'): Promise<AllergensStats> {
  const { data } = await api.get<AllergensStats>('/api/stats/allergens', { params: { period } });
  return data;
}
