import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/global/app-sidebar';
import AppBreadcrumb from '@/components/global/app-breadcrumb';
import { ThemeProvider } from '@/components/global/theme-provider';
import { Outlet } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import axiosHelper from '@/lib/axios-helper';
import type Project from '@/models/project/project';
import { setActiveProject } from '@/redux/reducers/projectSlice';

export default function Layout() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    fetchActiveProject();
  }, []);

  const fetchActiveProject = async () => {
    try {
      const response = await axiosHelper.get<Project>('/activeProject');
      if (response != null) dispatch(setActiveProject(response));
    } catch (error) {
      console.error('Failed to fetch active project:', error);
    }
  };

  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main>
            <header className='flex h-16 shrink-0 items-center gap-2'>
              <div className='flex items-center gap-2 px-4'>
                <SidebarTrigger className='-ml-1' />
                <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
                <AppBreadcrumb page='current page' links={[{ href: '/', label: 'Home' }]} />
              </div>
            </header>
            <Outlet />
            <Toaster />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
