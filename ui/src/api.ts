/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from './types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://storehouse-xbed.onrender.com';

export interface ApiUser {
  id: number;
  email: string;
  role: 'member' | 'ministers' | 'bishopric';
  active: boolean;
  firstname: string;
  lastname: string;
  gender: string;
  address: string;
  contact: string;
  stake_id: number;
  ward_id: number;
}

export interface AuthResponse {
  access_token: string;
  user: ApiUser;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  gender: string;
  address: string;
  contact: string;
  stake_id: number;
  ward_id: number;
}

export interface SignupResponse {
  message: string;
}

export interface Stake {
  id: number;
  name: string;
}

export interface Ward {
  id: number;
  name: string;
  stake_id: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(message || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SignupResponse>(res);
}

export async function getStakes(): Promise<Stake[]> {
  const res = await fetch(`${API_BASE_URL}/stakes`);
  return handleResponse<Stake[]>(res);
}

export async function getWards(stakeId: number): Promise<Ward[]> {
  const res = await fetch(`${API_BASE_URL}/wards?stakeId=${stakeId}`);
  return handleResponse<Ward[]>(res);
}

export interface Category {
  id: number;
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`);
  return handleResponse<Category[]>(res);
}

export type DonationStatus = 'available' | 'donated';

export interface ApiDonation {
  id: number;
  name: string;
  count: number;
  expiration: string;
  status: DonationStatus;
  createdAt: string;
  stake_id: number;
  ward_id: number;
  user_id: number;
  category_id: number;
  stake: Stake;
  ward: Ward;
  category: Category;
  user: { id: number; email: string; firstname: string; lastname: string };
}

export interface DonationPayload {
  name: string;
  count: number;
  expiration: string;
  category_id: number;
  status?: DonationStatus;
}

function authHeaders(): HeadersInit {
  const session = getStoredSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function getDonations(scope?: 'mine'): Promise<ApiDonation[]> {
  const query = scope ? `?scope=${scope}` : '';
  const res = await fetch(`${API_BASE_URL}/donations${query}`, { headers: authHeaders() });
  return handleResponse<ApiDonation[]>(res);
}

export async function createDonation(payload: DonationPayload): Promise<ApiDonation> {
  const res = await fetch(`${API_BASE_URL}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<ApiDonation>(res);
}

export async function updateDonation(id: number, payload: Partial<DonationPayload>): Promise<ApiDonation> {
  const res = await fetch(`${API_BASE_URL}/donations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<ApiDonation>(res);
}

export async function deleteDonation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/donations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse<unknown>(res);
}

export async function getUsers(): Promise<ApiUser[]> {
  const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
  return handleResponse<ApiUser[]>(res);
}

export interface UpdateUserPayload {
  firstname?: string;
  lastname?: string;
  gender?: string;
  address?: string;
  contact?: string;
  role?: ApiUser['role'];
  active?: boolean;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<ApiUser> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<ApiUser>(res);
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse<unknown>(res);
}

const ROLE_AVATARS: Record<ApiUser['role'], string> = {
  bishopric: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
  ministers: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  member: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
};

function roleTitle(apiUser: ApiUser): string {
  if (apiUser.role === 'bishopric') return 'Bishopric';
  if (apiUser.role === 'ministers') {
    return apiUser.gender.toLowerCase() === 'male' ? 'Ministering Brother' : 'Ministering Sister';
  }
  return 'Stake Member';
}

export function toSessionUser(apiUser: ApiUser): User {
  return {
    email: apiUser.email,
    name: `${apiUser.firstname} ${apiUser.lastname}`,
    role: apiUser.role,
    avatar: ROLE_AVATARS[apiUser.role],
    title: roleTitle(apiUser),
  };
}

const SESSION_KEY = 'storehouse_session';

export function saveSession(token: string, user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getStoredSession(): { token: string; user: User } | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
