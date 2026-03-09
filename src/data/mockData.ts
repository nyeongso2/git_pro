import { DiaryEntry } from '../types/diary';

export const mockEntries: DiaryEntry[] = [
    {
        id: '1',
        title: 'A Dreamy Afternoon',
        content: 'Today I spent the afternoon at a small cafe. The coffee was surprisingly good and the atmosphere was just what I needed. I read a few chapters of my book and felt incredibly peaceful.',
        date: '2026-03-08T14:30:00Z',
        mood: 'peaceful',
        tags: ['cafe', 'reading', 'peace'],
    },
    {
        id: '2',
        title: 'Productive Start of the Week',
        content: 'Started the week with a clear mind. Managed to finish all the tasks I had planned for today. Feeling a bit tired but very satisfied with the results.',
        date: '2026-03-09T18:00:00Z',
        mood: 'excited',
        tags: ['work', 'productivity'],
    },
    {
        id: '3',
        title: 'Rainy Night Musings',
        content: 'The sound of rain against the window is so soothing. It makes me want to stay in and just listen. Thinking about the future and what I want to achieve this year.',
        date: '2026-03-10T22:15:00Z',
        mood: 'neutral',
        tags: ['rain', 'thoughts'],
    }
];
