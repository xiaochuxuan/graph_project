import { getSiteURL } from '@/lib/get-site-url';
import { LogLevel } from '@/lib/logger';

export interface Config {
  site: { name: string; description: string; themeColor: string; url: string };
  logLevel: keyof typeof LogLevel;
}

export const config: Config = {
  site: {
    name: 'HSGraph 项目验收工作台',
    description: '2023BAB078 大规模图数据智能处理技术研究',
    themeColor: '#090a0b',
    url: getSiteURL(),
  },
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) ?? LogLevel.ALL,
};
