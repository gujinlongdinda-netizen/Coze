import { UserInfo } from '../contexts/authContext';

// 数据库键名常量
const DB_KEYS = {
  USERS: 'app_users',
  CURRENT_USER: 'current_user'
};

// 用户数据接口扩展
export interface StoredUserInfo extends UserInfo {
  createdAt: string;
  updatedAt: string;
}

/**
 * 模拟数据库管理类
 * 提供用户数据的增删改查功能
 */
class Database {
  // 获取所有用户数据
  private getAllUsers(): Record<string, StoredUserInfo> {
    try {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('获取用户数据失败:', error);
      return {};
    }
  }

  // 保存所有用户数据
  private saveAllUsers(users: Record<string, StoredUserInfo>): void {
    try {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw new Error('数据保存失败');
    }
  }

  // 创建新用户
  createUser(email: string): StoredUserInfo {
    const users = this.getAllUsers();
    const now = new Date().toISOString();

    // 检查用户是否已存在
    if (users[email]) {
      throw new Error('用户已存在');
    }

    // 创建新用户
    const newUser: StoredUserInfo = {
      id: `user_${email}`,
      email,
      remainingWords: 500, // 新用户默认500字免费额度
      isFirstTime: true,
      lastUsedDate: now,
      createdAt: now,
      updatedAt: now
    };

    users[email] = newUser;
    this.saveAllUsers(users);

    return newUser;
  }

  // 获取用户信息
  getUser(email: string): StoredUserInfo | null {
    const users = this.getAllUsers();
    return users[email] || null;
  }

  // 更新用户信息
  updateUser(userId: string, updates: Partial<StoredUserInfo>): StoredUserInfo {
    const users = this.getAllUsers();
    let user: StoredUserInfo | null = null;

    // 通过ID查找用户
    for (const key in users) {
      if (users[key].id === userId) {
        user = users[key];
        break;
      }
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    // 合并更新并设置更新时间
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    users[user.email] = updatedUser;
    this.saveAllUsers(users);

    return updatedUser;
  }

  // 更新用户剩余字数
  updateRemainingWords(userId: string, words: number): void {
    this.updateUser(userId, { remainingWords: words, lastUsedDate: new Date().toISOString() });
  }

  // 记录当前登录用户
  setCurrentUser(user: StoredUserInfo): void {
    try {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('设置当前用户失败:', error);
      throw new Error('设置当前用户失败');
    }
  }

  // 获取当前登录用户
  getCurrentUser(): StoredUserInfo | null {
    try {
      const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  // 清除当前登录用户
  clearCurrentUser(): void {
    try {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('清除当前用户失败:', error);
    }
  }
}

// 导出数据库实例
export const db = new Database();