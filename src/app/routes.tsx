import { createBrowserRouter } from 'react-router-dom';
import { ShelfHome } from '../features/diaries/ShelfHome';
import { DiaryRouter } from '../features/diaries/DiaryRouter';
import { Settings } from '../ui/Settings';
import AppShell from './AppShell';

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
