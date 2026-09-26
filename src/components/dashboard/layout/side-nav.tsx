'use client';

import * as React from 'react';
import { useState } from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';

import type { NavItemConfig } from '@/types/nav';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { Logo } from '@/components/core/logo';
import { CaretDown, CaretUp } from '@phosphor-icons/react';

import { navItems } from './config';

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: '100%',
        left: 0,
        maxWidth: '100%',
        position: 'fixed',
        scrollbarWidth: 'none',
        top: 0,
        width: 'var(--SideNav-width)',
        zIndex: 'var(--SideNav-zIndex)',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center'}}>
          <Logo color="light" height={32} width={32} />
          <Box
          sx={{
            alignItems: 'center',
            backgroundColor: 'var(--mui-palette-neutral-950)',
            display: 'flex',
            p: '4px 12px',
          }}
        >
          <Box sx={{ flex: '1 1 auto' }}>
            <Typography sx={{color: '#BAB8B8', fontSize: '13px'}}>
              湖北省重点研发计划
            </Typography>
            <Typography color="inherit" sx={{fontSize: '15px'}} >
              大规模图数据智能处理
            </Typography>
            <Typography color="inherit" sx={{fontSize: '15px'}}>
              (2023BAB078)
            </Typography>
          </Box>
         </Box>
        </Box>

      </Stack>
      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
        {renderNavItems({ pathname, items: navItems })}
      </Box>
      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
    </Box>
  );
}

function renderNavItems({ items = [], pathname }: { items?: NavItemConfig[]; pathname: string }): React.JSX.Element {
  const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
    const { key, ...item } = curr;

    acc.push(<NavItem key={key} pathname={pathname} {...item} />);

    return acc;
  }, []);

  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends NavItemConfig {
  pathname: string;
}

function NavItem({ disabled, external, href, pathname, title, subItems }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ href, pathname, subItems });

  const [open, setOpen] = useState(false);
  const handleClick = (): void => {
    if (subItems && subItems.length > 0) {
      setOpen(!open);
    }
  };

  return (
    <Box sx={{margin: '4px 0 4px 0'}}>
      <Box
        {...(href
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '4px 12px',
          position: 'relative',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
            cursor: 'not-allowed',
          }),
          ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
        }}
        onClick={handleClick}
      >
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography
            component="span"
            sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}
          >
            {title}
          </Typography>
        </Box>
        {subItems && subItems.length > 0 ? (
          <Box
            component="span"
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              flex: '0 0 auto',
              fontSize: 'var(--icon-fontSize-md)',
            }}
          >
            {open ? <CaretUp /> : <CaretDown />}
          </Box>
        ) : null}
      </Box>
      {subItems && subItems.length > 0 ? <Collapse in={open}>
          <Box sx={{ pl: 3 }}>
            {subItems.map((subItem) => (
              <NavItem key={subItem.key} pathname={pathname} title={subItem.title} href={subItem.href} />
            ))}
          </Box>
        </Collapse> : null}
    </Box>
  );
}
