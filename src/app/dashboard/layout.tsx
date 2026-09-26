import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '230px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />
      <Box
        sx={{
          bgcolor: 'var(--mui-palette-background-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100%',
        }}
      >
        <SideNav />
        <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pl: { lg: 'var(--SideNav-width)' } }}>
          <main>
            <Container
              maxWidth="xl"
              sx={{ padding: { xs: '16px', md: '28px' }, margin: '0 auto', backgroundColor: '#f5f7fa' }}
            >
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </>
  );
}
