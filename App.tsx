import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, Outlet, Navigate, useParams } from 'react-router-dom';
import { User, Team, Meeting, Document, FileLockerItem, ChatMessage, Role } from './types';
import AuthPage from './components/Auth';
import DashboardPage from './components/Dashboard';
import TeamPage from './components/Team';
import { DashboardIcon, UsersIcon, LogOutIcon, PlusIcon } from './components/Icons';
import { dbService } from './services/db';

// App Context
interface AppContextType {
    currentUser: User | null;
    isDbReady: boolean;
    users: User[];
    teams: Team[];
    meetings: Meeting[];
    documents: Document[];
    files: FileLockerItem[];
    messages: ChatMessage[];
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    signup: (name: string, email: string, pass: string) => Promise<boolean>;
    createTeam: (name: string) => Promise<void>;
    getTeam: (teamId: string) => Team | undefined;
    getUser: (userId: string) => User | undefined;
    getTeamMeetings: (teamId: string) => Meeting[];
    addMeeting: (meeting: Omit<Meeting, 'id'>) => Promise<void>;
    getTeamDocuments: (teamId: string) => Document[];
    addDocument: (doc: Omit<Document, 'id'>) => Promise<void>;
    getTeamFiles: (teamId: string) => FileLockerItem[];
    addFile: (file: Omit<FileLockerItem, 'id'>) => Promise<void>;
    getTeamMessages: (teamId: string, channelId: string) => ChatMessage[];
    addMessage: (message: Omit<ChatMessage, 'id'>) => Promise<void>;
    updateUserRole: (teamId: string, userId: string, role: Role) => Promise<void>;
    addTeamMember: (teamId: string, email: string) => Promise<{ success: boolean; message: string }>;
    removeTeamMember: (teamId: string, userId: string) => Promise<void>;
    deleteTeam: (teamId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

// AppProvider Component
const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDbReady, setIsDbReady] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('collaborax_currentUser') || 'null'));
    
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [files, setFiles] = useState<FileLockerItem[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const reloadData = () => {
        setUsers(dbService.getUsers());
        setTeams(dbService.getTeams());
        setMeetings(dbService.getMeetings());
        setDocuments(dbService.getDocuments());
        setFiles(dbService.getFiles());
        setMessages(dbService.getMessages());
    }

    useEffect(() => {
        const initDB = async () => {
            await dbService.init();
            reloadData();
            setIsDbReady(true);
        }
        initDB();
    }, []);
    
    useEffect(() => {
        localStorage.setItem('collaborax_currentUser', JSON.stringify(currentUser));
    }, [currentUser]);


    const login = async (email: string, pass: string) => {
        const user = dbService.login(email, pass);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => setCurrentUser(null);
    
    const signup = async (name: string, email: string, pass: string) => {
        const success = dbService.signup({name, email, password: pass});
        if(success) {
           return login(email, pass);
        }
        return false;
    };

    const createTeam = async (name: string) => {
        if (!currentUser) return;
        dbService.createTeam(name, currentUser);
        reloadData();
    };
    
    const addMeeting = async (meeting: Omit<Meeting, 'id'>) => {
        dbService.addMeeting(meeting);
        reloadData();
    }

    const addDocument = async (doc: Omit<Document, 'id'>) => {
        dbService.addDocument(doc);
        reloadData();
    }
    
    const addFile = async (file: Omit<FileLockerItem, 'id'>) => {
        dbService.addFile(file);
        reloadData();
    }

    const addMessage = async (msg: Omit<ChatMessage, 'id'>) => {
        dbService.addMessage(msg);
        reloadData();
    }
    
    const updateUserRole = async (teamId: string, userId: string, role: Role) => {
        dbService.updateUserRole(teamId, userId, role);
        reloadData();
    }

    const addTeamMember = async (teamId: string, email: string) => {
        const result = dbService.addTeamMember(teamId, email);
        if (result.success) {
            reloadData();
        }
        return result;
    }

    const removeTeamMember = async (teamId: string, userId: string) => {
        dbService.removeTeamMember(teamId, userId);
        reloadData();
    }

    const deleteTeam = async (teamId: string) => {
        dbService.deleteTeam(teamId);
        reloadData();
    }

    const value: AppContextType = {
        currentUser, isDbReady, users, teams, meetings, documents, files, messages,
        login, logout, signup, createTeam, addMeeting, addDocument, addFile, addMessage, updateUserRole,
        addTeamMember, removeTeamMember, deleteTeam,
        getTeam: (teamId) => teams.find(t => t.id === teamId),
        getUser: (userId) => users.find(u => u.id === userId),
        getTeamMeetings: (teamId) => meetings.filter(m => m.teamId === teamId).sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
        getTeamDocuments: (teamId) => documents.filter(d => d.teamId === teamId),
        getTeamFiles: (teamId) => files.filter(f => f.teamId === teamId),
        getTeamMessages: (teamId, channelId) => messages.filter(m => m.teamId === teamId && m.channelId === channelId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };

    if (!isDbReady) {
        return <div className="h-screen w-screen flex items-center justify-center bg-primary">Carregando banco de dados...</div>
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


// Layout Components
const Header: React.FC = () => {
    const { currentUser, logout } = useAppContext();
    return (
        <header className="bg-secondary h-16 flex items-center justify-end px-6 border-b border-slate-700">
            {currentUser && (
                <div className="flex items-center gap-4">
                    <span className="font-semibold">{currentUser.name}</span>
                    <button onClick={logout} className="flex items-center gap-2 text-dark-text hover:text-accent transition-colors">
                        <LogOutIcon className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            )}
        </header>
    );
};

const Sidebar: React.FC = () => {
    const { currentUser, teams, createTeam } = useAppContext();
    const userTeams = currentUser ? teams.filter(team => team.members.some(m => m.userId === currentUser.id)) : [];

    const handleCreateTeam = async () => {
        const teamName = prompt("Digite o nome do novo time:");
        if (teamName) {
            await createTeam(teamName);
        }
    }

    return (
        <aside className="w-64 bg-secondary flex flex-col border-r border-slate-700">
            <div className="h-16 flex items-center justify-center border-b border-slate-700">
                <Link to="/dashboard" className="text-2xl font-bold text-accent">CollaboraX</Link>
            </div>
            <nav className="flex-1 p-4 space-y-4">
                <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-dark-text hover:bg-slate-700 hover:text-light transition-colors ${isActive ? 'bg-slate-700 !text-light' : ''}`}>
                    <DashboardIcon className="w-5 h-5"/> Painel
                </NavLink>
                <div className="pt-4">
                    <h3 className="px-3 text-xs font-semibold uppercase text-slate-500 mb-2">Meus Times</h3>
                    <div className="space-y-1">
                        {userTeams.map(team => (
                            <NavLink key={team.id} to={`/team/${team.id}`} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm text-dark-text hover:bg-slate-700 hover:text-light transition-colors ${isActive ? 'bg-slate-700 !text-light' : ''}`}>
                                <UsersIcon className="w-5 h-5" /> {team.name}
                            </NavLink>
                        ))}
                    </div>
                    <button onClick={handleCreateTeam} className="w-full flex items-center gap-2 mt-4 px-3 py-2 text-sm text-accent hover:bg-slate-700 rounded-md">
                        <PlusIcon className="w-5 h-5"/> Criar Time
                    </button>
                </div>
            </nav>
        </aside>
    );
}

// Protected Route & Main Layout
const ProtectedLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-primary">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 animate-fadeIn">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};


// Main App Component
const App: React.FC = () => {
    return (
        <AppProvider>
            <AppRoutes />
        </AppProvider>
    );
};

const AppRoutes: React.FC = () => {
    const { currentUser, isDbReady } = useAppContext();

    if (!isDbReady) return null; // Or a loading spinner

    return (
         <HashRouter>
            <Routes>
                <Route path="/login" element={!currentUser ? <AuthPage /> : <Navigate to="/dashboard" />} />
                <Route path="/" element={currentUser ? <ProtectedLayout /> : <Navigate to="/login" />}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="team/:teamId" element={<TeamPage />} />
                </Route>
            </Routes>
        </HashRouter>
    )
}

export default App;