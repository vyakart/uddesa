import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Shelf } from './components/Shelf/Shelf';

import { Scratchpad } from './components/Diaries/Scratchpad';

import { Blackboard } from './components/Diaries/Blackboard';

import { PersonalDiary } from './components/Diaries/PersonalDiary';

import { Drafts } from './components/Diaries/Drafts';

import { LongDrafts } from './components/Diaries/LongDrafts';

import { AcademicPapers } from './components/Diaries/AcademicPapers';

// Placeholder for other diaries
const DiaryPlaceholder: React.FC = () => {
    return (
        <div style={{ color: 'white', padding: '2rem' }}>
            <h1>Diary Interface</h1>
            <p>Coming soon...</p>
            <a href="/" style={{ textDecoration: 'underline' }}>Back to Shelf</a>
        </div>
    );
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <Shelf />,
    },
    {
        path: '/diary/0',
        element: <Scratchpad />,
    },
    {
        path: '/diary/1',
        element: <Blackboard />,
    },
    {
        path: '/diary/2',
        element: <PersonalDiary />,
    },
    {
        path: '/diary/3',
        element: <Drafts />,
    },
    {
        path: '/diary/4',
        element: <LongDrafts />,
    },
    {
        path: '/diary/5',
        element: <AcademicPapers />,
    },
    {
        path: '/diary/:id',
        element: <DiaryPlaceholder />,
    },
]);

const App: React.FC = () => {
    return <RouterProvider router={router} />;
};

export default App;
