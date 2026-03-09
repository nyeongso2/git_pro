export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    time?: string; // HH:mm format
}

export interface DiaryHistory {
    id: string;
    content: string;
    mood: string;
    timestamp: string;
    summary: string;
}

export interface UserInfo {
    id: string;
    email: string;
    password?: string;
    name: string;
    age: string;
    gender: 'male' | 'female' | 'other';
    joinDate: string;
}

export interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    date: string; // YYYY-MM-DD
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'peaceful';
    todos: Todo[];
    isAnniversary?: boolean;
    anniversaryTitle?: string;
    aiSummary?: string;
    history?: DiaryHistory[];
}
