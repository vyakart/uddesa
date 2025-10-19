import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import AppShell from './AppShell';

const ShelfHome = lazy(() =>
  import('../features/diaries/ShelfHome').then((module) => ({ default: module.ShelfHome })),
);

const DiaryRouter = lazy(() =>
  import('../features/diaries/DiaryRouter').then((module) => ({ default: module.DiaryRouter })),
);

const Settings = lazy(() =>
  import('../ui/Settings').then((module) => ({ default: module.Settings })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ShelfHome /> },
      { path: 'diary/:id', element: <DiaryRouter /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
