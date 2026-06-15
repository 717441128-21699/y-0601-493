// 存储数据包装结构
interface StorageWrapper<T> {
  value: T;
  expireAt?: number; // 过期时间戳（毫秒）
}

/**
 * LocalStorage 封装工具类
 * 提供带类型泛型、过期时间的本地存储操作
 */
export const LocalStorage = {
  /**
   * 获取 LocalStorage 数据
   * @param key 存储键名
   * @returns 存储的值，不存在或已过期返回 null
   */
  get<T = unknown>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;

      const wrapper: StorageWrapper<T> = JSON.parse(raw);

      if (wrapper.expireAt && Date.now() > wrapper.expireAt) {
        window.localStorage.removeItem(key);
        return null;
      }

      return wrapper.value;
    } catch {
      return null;
    }
  },

  /**
   * 设置 LocalStorage 数据
   * @param key 存储键名
   * @param val 存储值
   * @param expire_ms 过期时间（毫秒），不传则永久
   */
  set<T = unknown>(key: string, val: T, expire_ms?: number): void {
    try {
      const wrapper: StorageWrapper<T> = {
        value: val,
        expireAt: expire_ms ? Date.now() + expire_ms : undefined,
      };
      window.localStorage.setItem(key, JSON.stringify(wrapper));
    } catch {
      console.warn('[LocalStorage] 设置失败，可能超出存储配额');
    }
  },

  /**
   * 删除 LocalStorage 指定键
   * @param key 存储键名
   */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 忽略错误
    }
  },

  /**
   * 清空 LocalStorage 所有数据
   */
  clear(): void {
    try {
      window.localStorage.clear();
    } catch {
      // 忽略错误
    }
  },
};

/**
 * SessionStorage 封装工具类
 * 提供带类型泛型、过期时间的会话存储操作
 */
export const SessionStorage = {
  /**
   * 获取 SessionStorage 数据
   * @param key 存储键名
   * @returns 存储的值，不存在或已过期返回 null
   */
  get<T = unknown>(key: string): T | null {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return null;

      const wrapper: StorageWrapper<T> = JSON.parse(raw);

      if (wrapper.expireAt && Date.now() > wrapper.expireAt) {
        window.sessionStorage.removeItem(key);
        return null;
      }

      return wrapper.value;
    } catch {
      return null;
    }
  },

  /**
   * 设置 SessionStorage 数据
   * @param key 存储键名
   * @param val 存储值
   * @param expire_ms 过期时间（毫秒），不传则会话结束后清除
   */
  set<T = unknown>(key: string, val: T, expire_ms?: number): void {
    try {
      const wrapper: StorageWrapper<T> = {
        value: val,
        expireAt: expire_ms ? Date.now() + expire_ms : undefined,
      };
      window.sessionStorage.setItem(key, JSON.stringify(wrapper));
    } catch {
      console.warn('[SessionStorage] 设置失败，可能超出存储配额');
    }
  },

  /**
   * 删除 SessionStorage 指定键
   * @param key 存储键名
   */
  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // 忽略错误
    }
  },

  /**
   * 清空 SessionStorage 所有数据
   */
  clear(): void {
    try {
      window.sessionStorage.clear();
    } catch {
      // 忽略错误
    }
  },
};
