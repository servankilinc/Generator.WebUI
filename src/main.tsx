import { createRoot } from 'react-dom/client';
import { store } from '@/redux/store.ts';
import { Provider } from 'react-redux';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import '@/styles/index.css';
import BaseLayout from '@/layouts/base';
import Home from '@/views/home';
import Projects from '@/views/project';
import Entities from '@/views/entity/index';

const router = createBrowserRouter([
  {
    path: '/',
    Component: BaseLayout,
    children: [
      { index: true, Component: Home },
      { path: 'projects', Component: Projects },
      { path: 'entities', Component: Entities }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
