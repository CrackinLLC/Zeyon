export interface ApiResponse<T = any> {
  data?: T | null;
  errors?: string[];
  ok: boolean;
  message?: string;
}

const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const result: ApiResponse<T> = {
    ok: response.ok,
  };

  try {
    const json = await response.json();

    if (response.ok) {
      result.data = json as T;
    } else {
      result.errors = json.errors || [json.message || 'API request failed'];
    }
  } catch (error: any) {
    result.errors = [error.message || 'An unexpected error occurred'];
  }

  return result;
};

const getRequestOptions = (method: string, payload?: object): RequestInit => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for authentication if needed
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  return options;
};

const buildUrl = (endpoint: string): string => {
  return `${window.location.origin}${endpoint}`;
};

// Generic function to handle API requests
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  payload?: object,
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(buildUrl(endpoint), getRequestOptions(method, payload));
    return await handleApiResponse<T>(response);
  } catch (error: any) {
    return {
      ok: false,
      errors: [error.message || 'Unknown error occurred'],
      data: null,
    };
  }
};

export const apiGet = async <T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> => {
  const url = new URL(buildUrl(endpoint));
  if (params) {
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
  }
  const response = await fetch(url.toString(), getRequestOptions('GET'));
  return handleApiResponse<T>(response);
};

export const apiPost = async <T>(endpoint: string, payload: object): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, 'POST', payload);
};

export const apiPut = async <T>(endpoint: string, payload: object): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, 'PUT', payload);
};

export const apiDelete = async <T>(endpoint: string, payload?: object): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, 'DELETE', payload);
};

////////////////////////////////////////
// Account Router Endpoints

export const createAccount = async (
  email: string,
  password: string,
  team_id?: number | 'new',
): Promise<ApiResponse<any>> => {
  return apiPost(`/account/register`, { email, password, team_id });
};

export const loginUser = async (email: string, password: string): Promise<ApiResponse<any>> => {
  return apiPost(`/account/login`, { email, password });
};

export const logoutUser = async (): Promise<ApiResponse<any>> => {
  return apiPost(`/account/logout`, {});
};

export const fetchAccountDetails = async (): Promise<ApiResponse<any>> => {
  return apiGet(`/account`);
};

export const updateAccountDetails = async (payload: object): Promise<ApiResponse<any>> => {
  return apiPut(`/account`, payload);
};

export const changePassword = async (old_password: string, new_password: string): Promise<ApiResponse<any>> => {
  return apiPut(`/account/password`, { old_password, new_password });
};

export const deleteAccount = async (): Promise<ApiResponse<any>> => {
  return apiDelete(`/account`);
};

////////////////////////////////////////
// Data Router Endpoints

export const fetchAllData = async (type: string): Promise<ApiResponse<any>> => {
  return apiGet(`/data/${type}`);
};

export const fetchDataById = async (type: string, id: number | number[]): Promise<ApiResponse<any>> => {
  if (Array.isArray(id)) {
    return apiPost(`/data/${type}/bulk`, { ids: id });
  } else {
    return apiGet(`/data/${type}/${id}`);
  }
};

export const createData = async (type: string, payload: object): Promise<ApiResponse<any>> => {
  return apiPost(`/data/${type}`, payload);
};

export const updateDataById = async (
  type: string,
  id: number | number[],
  payload: object,
): Promise<ApiResponse<any>> => {
  if (Array.isArray(id)) {
    return apiPost(`/data/${type}/bulk`, { ids: id, data: payload });
  } else {
    return apiPut(`/data/${type}/${id}`, payload);
  }
};

export const deleteDataById = async (type: string, id: number | number[]): Promise<ApiResponse<any>> => {
  if (Array.isArray(id)) {
    return apiDelete(`/data/${type}/bulk`, { ids: id });
  } else {
    return apiDelete(`/data/${type}/${id}`);
  }
};
