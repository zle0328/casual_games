import type { ApiResponse } from '../types';

// API 基础地址（开发时填写）
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
}

/**
 * 封装 uni.request
 */
export function request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as ApiResponse<T>);
        } else {
          reject(new Error((res.data as any)?.error || '请求失败'));
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络请求失败',
          icon: 'none',
        });
        reject(err);
      },
    });
  });
}

/**
 * GET 请求
 */
export function get<T>(url: string, data?: any) {
  return request<T>({ url, method: 'GET', data });
}

/**
 * POST 请求
 */
export function post<T>(url: string, data?: any) {
  return request<T>({ url, method: 'POST', data });
}

/**
 * PUT 请求
 */
export function put<T>(url: string, data?: any) {
  return request<T>({ url, method: 'PUT', data });
}

/**
 * DELETE 请求
 */
export function del<T>(url: string, data?: any) {
  return request<T>({ url, method: 'DELETE', data });
}
