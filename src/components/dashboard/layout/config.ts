import type { NavItemConfig } from '@/types/nav';
import categories from '@/data/acceptance-categories.json';

export const navItems = [
  { key: 'preprocessing', title: '数据预处理', href: '/dashboard/preprocessing' },
  ...categories.map((category) => ({
    key: category.id,
    title: category.title,
    href: `/dashboard/acceptance/${category.id}`,
  })),
] satisfies NavItemConfig[];
