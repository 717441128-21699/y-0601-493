type UserLevel = 1 | 2 | 3;
type UserRole = 'NATIONAL' | 'PROVINCE' | 'CITY' | 'COLD_CHAIN' | 'VACCINE_POINT';

export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  level: UserLevel;
  role: UserRole;
  province?: string;
  provinceCode?: string;
  city?: string;
  cityCode?: string;
  permissions: string[];
  avatar?: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
}

interface TestUser {
  username: string;
  password: string;
  level: UserLevel;
  realName: string;
  role: UserRole;
  province?: string;
  provinceCode?: string;
  city?: string;
  cityCode?: string;
}

const TEST_USERS: TestUser[] = [
  {
    username: 'admin_national',
    password: '123456',
    level: 1,
    realName: '国家管理员',
    role: 'NATIONAL',
  },
  {
    username: 'admin_beijing',
    password: '123456',
    level: 2,
    realName: '北京管理员',
    role: 'PROVINCE',
    province: '北京市',
    provinceCode: '110000',
  },
  {
    username: 'admin_shanghai',
    password: '123456',
    level: 2,
    realName: '上海管理员',
    role: 'PROVINCE',
    province: '上海市',
    provinceCode: '310000',
  },
  {
    username: 'cold_zhangsan',
    password: '123456',
    level: 3,
    realName: '张三',
    role: 'COLD_CHAIN',
    province: '北京市',
    provinceCode: '110000',
    city: '东城区',
    cityCode: '110101',
  },
  {
    username: 'vaccinate_lisi',
    password: '123456',
    level: 3,
    realName: '李四',
    role: 'VACCINE_POINT',
    province: '上海市',
    provinceCode: '310000',
    city: '浦东新区',
    cityCode: '310115',
  },
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  NATIONAL: [
    'dashboard:view',
    'coldchain:view',
    'coldchain:equipment',
    'inventory:view',
    'vaccination:view',
    'alerts:view',
    'alerts:handle',
    'alerts:approve',
    'plan:view',
    'plan:edit',
    'plan:forecast',
    'reports:view',
    'reports:download',
    'settings:user',
    'settings:threshold',
    'settings:dict',
  ],
  PROVINCE: [
    'dashboard:view',
    'coldchain:view',
    'coldchain:equipment',
    'inventory:view',
    'vaccination:view',
    'alerts:view',
    'alerts:handle',
    'alerts:approve',
    'plan:view',
    'plan:edit',
    'plan:forecast',
    'reports:view',
    'reports:download',
  ],
  CITY: [
    'dashboard:view',
    'coldchain:view',
    'inventory:view',
    'vaccination:view',
    'alerts:view',
    'alerts:handle',
    'reports:view',
  ],
  COLD_CHAIN: [
    'coldchain:view',
    'coldchain:equipment',
    'alerts:view',
    'alerts:handle',
  ],
  VACCINE_POINT: [
    'inventory:view',
    'vaccination:view',
    'vaccination:record',
  ],
};

const tokenStore = new Map<string, { userInfo: UserInfo; createTime: number }>();

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function testUserToUserInfo(testUser: TestUser): UserInfo {
  return {
    id: `user_${testUser.username}`,
    username: testUser.username,
    realName: testUser.realName,
    level: testUser.level,
    role: testUser.role,
    province: testUser.province,
    provinceCode: testUser.provinceCode,
    city: testUser.city,
    cityCode: testUser.cityCode,
    permissions: ROLE_PERMISSIONS[testUser.role],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testUser.username}`,
  };
}

export function mockLogin(username: string, password: string, _level?: UserLevel): LoginResult | null {
  const user = TEST_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return null;
  }

  const token = generateToken();
  const userInfo = testUserToUserInfo(user);

  tokenStore.set(token, {
    userInfo,
    createTime: Date.now(),
  });

  try {
    localStorage.setItem('mock_token', token);
    localStorage.setItem('mock_userInfo', JSON.stringify(userInfo));
  } catch (_e) {
    // ignore
  }

  return { token, userInfo };
}

export function mockGetUserInfo(token: string): UserInfo | null {
  const stored = tokenStore.get(token);
  if (stored) {
    return stored.userInfo;
  }

  try {
    const localToken = localStorage.getItem('mock_token');
    const localUserInfo = localStorage.getItem('mock_userInfo');
    if (localToken === token && localUserInfo) {
      const userInfo = JSON.parse(localUserInfo) as UserInfo;
      tokenStore.set(token, { userInfo, createTime: Date.now() });
      return userInfo;
    }
  } catch (_e) {
    // ignore
  }

  return null;
}

export function mockLogout(): boolean {
  try {
    const token = localStorage.getItem('mock_token');
    if (token) {
      tokenStore.delete(token);
    }
    localStorage.removeItem('mock_token');
    localStorage.removeItem('mock_userInfo');
  } catch (_e) {
    // ignore
  }
  return true;
}

export function mockGetCurrentUser(): UserInfo | null {
  try {
    const token = localStorage.getItem('mock_token');
    if (token) {
      return mockGetUserInfo(token);
    }
  } catch (_e) {
    // ignore
  }
  return null;
}
