import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, ChevronLeft, ChevronRight,
    Check, Save, Trash2, Calendar as CalIcon,
    Circle, CheckCircle2, Bookmark, Flame, Star, History, Sparkles, X, User as UserIcon, Lock, Mail, LogOut, Users, ArrowLeft, ShieldCheck
} from 'lucide-react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    isToday, parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DiaryEntry, Todo, DiaryHistory, UserInfo } from './types/diary';

const App: React.FC = () => {
    // 1. User Database (Shared)
    const [users, setUsers] = useState<UserInfo[]>(() => {
        const savedUsers = localStorage.getItem('diary_app_users_v2');
        const guest: UserInfo = {
            id: 'admin',
            email: 'guest123',
            password: 'guest123',
            name: '관리자',
            age: '99',
            gender: 'other',
            joinDate: format(new Date(), 'yyyy-MM-dd')
        };
        return savedUsers ? JSON.parse(savedUsers) : [guest];
    });

    // 2. Auth State (Current Logged-in User)
    const [user, setUser] = useState<UserInfo | null>(() => {
        const savedUser = localStorage.getItem('diary_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isLoginView, setIsLoginView] = useState(true);
    const [isAdminPanel, setIsAdminPanel] = useState(false);

    // 3. User-Specific Diary Data
    const [allUserEntries, setAllUserEntries] = useState<Record<string, Record<string, DiaryEntry>>>(() => {
        const saved = localStorage.getItem('diary_db_vault');
        return saved ? JSON.parse(saved) : {};
    });

    // Derived State: Entries for the current user
    const entries = user ? (allUserEntries[user.email] || {}) : {};

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Local Temp State for Editor
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<UserInfo['gender']>('male');

    const [todoInput, setTodoInput] = useState('');
    const [todoTime, setTodoTime] = useState('12:00');
    const [tempContent, setTempContent] = useState('');
    const [tempMood, setTempMood] = useState<DiaryEntry['mood']>('neutral');
    const [tempIsAnniversary, setTempIsAnniversary] = useState(false);
    const [tempAnniversaryTitle, setTempAnniversaryTitle] = useState('');

    // Persistence Effects
    useEffect(() => { localStorage.setItem('diary_app_users_v2', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('diary_db_vault', JSON.stringify(allUserEntries)); }, [allUserEntries]);
    useEffect(() => {
        if (user) localStorage.setItem('diary_user', JSON.stringify(user));
        else localStorage.removeItem('diary_user');
    }, [user]);

    // Helpers to update user specific entries
    const updateUserEntries = (newEntries: Record<string, DiaryEntry>) => {
        if (!user) return;
        setAllUserEntries(prev => ({
            ...prev,
            [user.email]: newEntries
        }));
    };

    // Auth Handlers
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            setUser(foundUser);
            // Don't auto-jump to admin panel, let user choose via UI
            setIsAdminPanel(false);
            alert(`반갑습니다, ${foundUser.name}님! ✨`);
        } else {
            alert('정보가 일치하지 않거나 등록되지 않은 사용자입니다.');
        }
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (users.some(u => u.email === email)) {
            alert('이미 존재하는 아이디입니다.');
            return;
        }
        const newUser: UserInfo = {
            id: Date.now().toString(),
            email, password, name, age, gender,
            joinDate: format(new Date(), 'yyyy-MM-dd')
        };
        setUsers([...users, newUser]);
        setIsLoginView(true);
        alert('회원가입이 완료되었습니다! 👏');
    };

    const handleLogout = () => {
        setUser(null);
        setIsAdminPanel(false);
        alert('로그아웃 되었습니다.');
    };

    // Date change logic
    useEffect(() => {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const entry = entries[dateKey];
        setTempContent('');
        setTempMood('neutral');
        setTempIsAnniversary(entry?.isAnniversary || false);
        setTempAnniversaryTitle(entry?.anniversaryTitle || '');
    }, [selectedDate, user]); // Refetch when user changes too

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentEntry = entries[dateKey];

    const generateAISummary = (content: string) => {
        if (!content.trim()) return "기록된 내용이 없습니다.";
        const firstLine = content.split('\n')[0];
        return `✨ ${firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine}`;
    };

    const handleSaveDiary = () => {
        if (!tempContent.trim()) return alert('내용을 입력해주세요!');
        const existingEntry = entries[dateKey] || { id: Date.now().toString(), todos: [], history: [], date: dateKey };
        const summary = generateAISummary(tempContent);
        const newHistoryItem: DiaryHistory = {
            id: Date.now().toString(),
            content: tempContent,
            mood: tempMood,
            timestamp: format(new Date(), 'HH:mm'),
            summary
        };
        const newEntry: DiaryEntry = {
            ...existingEntry,
            content: tempContent,
            mood: tempMood,
            isAnniversary: tempIsAnniversary,
            anniversaryTitle: tempAnniversaryTitle,
            aiSummary: summary,
            history: [newHistoryItem, ...(existingEntry.history || [])]
        } as DiaryEntry;

        updateUserEntries({ ...entries, [dateKey]: newEntry });
        setTempContent('');
        alert('저장되었습니다! ✍️');
    };

    const loadFromHistory = (item: DiaryHistory) => {
        setTempContent(item.content);
        setTempMood(item.mood as any);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteHistoryItem = (historyId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentEntry) return;
        const updatedHistory = currentEntry.history?.filter(h => h.id !== historyId);
        updateUserEntries({ ...entries, [dateKey]: { ...currentEntry, history: updatedHistory } });
    };

    const handleAddTodo = () => {
        if (!todoInput.trim()) return;
        const newTodo: Todo = { id: Date.now().toString(), text: todoInput, completed: false, time: todoTime };
        const existingEntry = entries[dateKey] || { id: Date.now().toString(), todos: [], history: [], date: dateKey };
        const updatedTodos = [...(existingEntry.todos || []), newTodo].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        updateUserEntries({ ...entries, [dateKey]: { ...existingEntry, todos: updatedTodos } as DiaryEntry });
        setTodoInput('');
    };

    const toggleTodo = (id: string) => {
        if (!currentEntry) return;
        const updatedTodos = currentEntry.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        updateUserEntries({ ...entries, [dateKey]: { ...currentEntry, todos: updatedTodos } });
    };

    const deleteTodo = (id: string) => {
        if (!currentEntry) return;
        const updatedTodos = currentEntry.todos.filter(t => t.id !== id);
        updateUserEntries({ ...entries, [dateKey]: { ...currentEntry, todos: updatedTodos } });
    };

    const clearCurrentUserData = () => {
        if (window.confirm('정말 본인의 모든 기록을 삭제하시겠습니까? (다른 회원의 데이터는 삭제되지 않습니다.)')) {
            updateUserEntries({});
            alert('본인의 모든 데이터가 초기화되었습니다.');
        }
    };

    const getMoodEmoji = (mood: string) => {
        const moods: any = { happy: '😊', neutral: '😐', sad: '😢', excited: '🤩', tired: '😴', peaceful: '🧘' };
        return moods[mood] || '😐';
    };

    // Calendar
    const monthStart = startOfMonth(currentMonth);
    const renderCalendar = () => {
        const days = [];
        let day = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(endOfMonth(monthStart));
        while (day <= calendarEnd) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dKey = format(day, 'yyyy-MM-dd');
                const hasData = entries[dKey];
                days.push(
                    <div
                        key={day.toString()}
                        className={`calendar-cell ${!isSameMonth(day, monthStart) ? 'other-month' : ''} ${isSameDay(day, selectedDate) ? 'active' : ''} ${hasData ? 'has-entry' : ''} ${hasData?.isAnniversary ? 'is-anniversary' : ''}`}
                        onClick={() => isSameMonth(cloneDay, monthStart) && setSelectedDate(cloneDay)}
                    >
                        {format(day, 'd')}
                    </div>
                );
                day = addDays(day, 1);
            }
        }
        return days;
    };

    if (!user) {
        return (
            <div className="auth-container">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`auth-card ${!isLoginView ? 'wide' : ''}`}>
                    <div className="auth-logo"><Bookmark size={32} /></div>
                    <h1 className="auth-title">{isLoginView ? '다시 오셨군요!' : '회원가입'}</h1>
                    <p className="auth-subtitle">{isLoginView ? '당신의 일상을 기록할 시간입니다.' : '정보를 입력하여 가입을 완료해주세요.'}</p>
                    <form className="auth-form" onSubmit={isLoginView ? handleLogin : handleSignup}>
                        <div className="auth-row">
                            <div className="auth-input-group">
                                <label className="auth-label">이메일/아이디</label>
                                <input className="auth-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-label">비밀번호</label>
                                <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                            </div>
                        </div>
                        {!isLoginView && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <div className="auth-row mt-4">
                                    <div className="auth-input-group">
                                        <label className="auth-label">이름</label>
                                        <input className="auth-input" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required />
                                    </div>
                                    <div className="auth-input-group">
                                        <label className="auth-label">나이</label>
                                        <input className="auth-input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="20" required />
                                    </div>
                                </div>
                                <div className="auth-input-group mt-4">
                                    <label className="auth-label">성별</label>
                                    <div className="gender-group">
                                        {(['male', 'female', 'other'] as const).map(g => (
                                            <label key={g} className="gender-option">
                                                <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
                                                {g === 'male' ? '남성' : g === 'female' ? '여성' : '기타'}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <button type="submit" className="btn-auth">{isLoginView ? '로그인' : '가입하기'}</button>
                    </form>
                    <p className="auth-switch">
                        {isLoginView ? '계정이 없으신가요?' : '이미 계정이 있나요?'}
                        <span className="auth-link" onClick={() => setIsLoginView(!isLoginView)}>{isLoginView ? '회원가입' : '로그인'}</span>
                    </p>
                </motion.div>
            </div>
        );
    }

    if (isAdminPanel) {
        return (
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3"><ShieldCheck size={36} className="text-purple-600" /> 관리 대시보드</h1>
                        <p className="text-zinc-400 mt-2">등록된 전체 회원 정보를 관리합니다.</p>
                    </div>
                    <button onClick={() => setIsAdminPanel(false)} className="btn-save" style={{ width: '160px' }}><ArrowLeft size={18} /> 다이어리로</button>
                </div>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr><th>가입일</th><th>이메일/ID</th><th>이름</th><th>나이</th><th>성별</th><th>상태</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.joinDate}</td><td>{u.email}</td><td>{u.name}</td><td>{u.age}세</td>
                                    <td>{u.gender === 'male' ? '남성' : u.gender === 'female' ? '여성' : '기타'}</td>
                                    <td><span className="user-badge">{u.email === 'guest123' ? 'ADMIN' : 'USER'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <aside className="calendar-sidebar">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><UserIcon size={16} /></div>
                        <span className="text-sm font-bold truncate max-w-[100px]">{user.name}님</span>
                    </div>
                    <div className="flex gap-2">
                        {user.email === 'guest123' && <button onClick={() => setIsAdminPanel(true)} className="text-zinc-400 hover:text-purple-600" title="관리자 페이지"><Users size={18} /></button>}
                        <button onClick={clearCurrentUserData} className="text-zinc-400 hover:text-rose-500" title="본인 기록 삭제"><Trash2 size={18} /></button>
                        <button onClick={handleLogout} className="text-zinc-400 hover:text-purple-600" title="로그아웃"><LogOut size={18} /></button>
                    </div>
                </div>
                <div className="calendar-header">
                    <h2 className="text-xl font-black">{format(currentMonth, 'yyyy. MM', { locale: ko })}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 rounded-lg"><ChevronLeft size={20} /></button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 rounded-lg"><ChevronRight size={20} /></button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="calendar-day-label">{d}</div>)}
                    {renderCalendar()}
                </div>
                <div className="ai-summary-card">
                    <div className="ai-badge"><Sparkles size={12} /> 최신 AI 요약</div>
                    <div className="ai-content">
                        {currentEntry?.aiSummary || "요약이 없습니다."}
                        {currentEntry?.isAnniversary && <p className="mt-2 text-rose-500 font-bold flex items-center gap-1"><Star size={14} /> {currentEntry.anniversaryTitle}</p>}
                    </div>
                    {currentEntry?.history && currentEntry.history.length > 0 && (
                        <div className="history-section">
                            <p className="history-title"><History size={12} /> 저장 기록</p>
                            {currentEntry.history.map(item => (
                                <div key={item.id} className="history-item" onClick={() => loadFromHistory(item)}>
                                    <div className="history-item-content">
                                        <p className="history-preview"><span>{getMoodEmoji(item.mood)}</span> {item.content}</p>
                                        <p className="history-time">{item.timestamp} 저장</p>
                                    </div>
                                    <button className="history-delete-btn" onClick={e => deleteHistoryItem(item.id, e)}><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
            <main className="main-planner">
                <div className="planner-card">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-purple-500 font-bold text-sm mb-1">{format(selectedDate, 'EEEE', { locale: ko })}</p>
                            <h2 className="text-4xl font-black">{format(selectedDate, 'M월 d일', { locale: ko })}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {isToday(selectedDate) && <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-purple-200">TODAY</span>}
                            <div className="flex items-center gap-1 mt-2"><label className="text-xs font-bold text-zinc-400">기념일</label><input type="checkbox" checked={tempIsAnniversary} onChange={e => setTempIsAnniversary(e.target.checked)} className="w-4 h-4 accent-purple-600" /></div>
                        </div>
                    </div>
                    {tempIsAnniversary && <div className="mb-6"><input className="todo-input" placeholder="기념일 이름" value={tempAnniversaryTitle} onChange={e => setTempAnniversaryTitle(e.target.value)} /></div>}
                    <h3 className="section-title">오늘의 기분</h3>
                    <div className="mood-selector mb-10">
                        {['happy', 'peaceful', 'neutral', 'excited', 'tired', 'sad'].map(m => (
                            <button key={m} className={`mood-btn ${tempMood === m ? 'active' : ''}`} onClick={() => setTempMood(m as any)}>
                                <span className="text-2xl">{getMoodEmoji(m)}</span>
                                <span className="text-xs font-bold mt-1">
                                    {m === 'excited' ? '기쁨' : m === 'happy' ? '행복' : m === 'neutral' ? '보통' : m === 'peaceful' ? '평온' : m === 'tired' ? '피곤' : '슬픔'}
                                </span>
                            </button>
                        ))}
                    </div>
                    <textarea className="editor-content" placeholder="오늘 하루는 어땠나요? 소중한 순간을 기록해보세요..." value={tempContent} onChange={e => setTempContent(e.target.value)} style={{ minHeight: '250px' }} />
                    <div className="flex justify-end mt-8"><button className="btn-save" onClick={handleSaveDiary}><Save size={20} /> 저장하기</button></div>
                </div>
                <div className="planner-card">
                    <h3 className="section-title"><CheckCircle2 size={24} className="text-purple-500" /> 할 일</h3>
                    <div className="todo-input-group mb-8">
                        <input type="time" className="todo-time-input" value={todoTime} onChange={e => setTodoTime(e.target.value)} />
                        <input className="todo-input" placeholder="할 일 추가..." value={todoInput} onChange={e => setTodoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTodo()} />
                        <button className="btn-add" onClick={handleAddTodo}><Plus size={24} /></button>
                    </div>
                    <div className="todo-list">
                        {currentEntry?.todos?.map(todo => (
                            <div key={todo.id} className="todo-item group p-4 bg-zinc-50/50 hover:bg-zinc-50 border border-transparent hover:border-zinc-100">
                                <div className={`todo-checkbox ${todo.completed ? 'checked' : ''}`} onClick={() => toggleTodo(todo.id)}>{todo.completed && <Check size={14} />}</div>
                                {todo.time && <span className="todo-time-tag">{todo.time}</span>}
                                <span className={`todo-text flex-1 ${todo.completed ? 'checked' : ''}`}>{todo.text}</span>
                                <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-2"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
