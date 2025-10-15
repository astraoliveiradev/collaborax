import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { Card, Button, Input, Modal } from './UI';
import { Role } from '../types';
import { CalendarIcon, FileTextIcon, ArchiveIcon, MessageSquareIcon, UsersIcon, PlusIcon, SendIcon, LockIcon, UnlockIcon, TrashIcon, LinkIcon } from './Icons';

type Tab = 'meetings' | 'documents' | 'lockers' | 'chat' | 'members';

const TeamPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { getTeam } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('meetings');
  
  if (!teamId) return <div>ID de Time Inválido</div>;
  const team = getTeam(teamId);
  if (!team) return <div>Time não encontrado.</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'meetings', label: 'Reuniões', icon: <CalendarIcon className="w-5 h-5"/> },
    { id: 'documents', label: 'Documentos', icon: <FileTextIcon className="w-5 h-5"/> },
    { id: 'lockers', label: 'Armários', icon: <ArchiveIcon className="w-5 h-5"/> },
    { id: 'chat', label: 'Chat', icon: <MessageSquareIcon className="w-5 h-5"/> },
    { id: 'members', label: 'Membros', icon: <UsersIcon className="w-5 h-5"/> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'meetings': return <MeetingsView teamId={teamId} />;
      case 'documents': return <DocumentsView teamId={teamId} />;
      case 'lockers': return <LockersView teamId={teamId} />;
      case 'chat': return <ChatView teamId={teamId} />;
      case 'members': return <MembersView teamId={teamId} />;
      default: return null;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-light mb-4">{team.name}</h1>
      <div className="border-b border-slate-700 mb-4">
        <nav className="-mb-px flex space-x-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-1 inline-flex items-center gap-2 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-dark-text hover:text-light'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto animate-fadeIn" key={activeTab}>
        {renderContent()}
      </div>
    </div>
  );
};


// Sub-components for each tab

const MeetingsView: React.FC<{teamId: string}> = ({ teamId }) => {
    const { getTeamMeetings, addMeeting, currentUser } = useAppContext();
    const meetings = getTeamMeetings(teamId);
    const [isModalOpen, setModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [meetLink, setMeetLink] = useState('');
    const [dateTime, setDateTime] = useState('');

    const handleSubmit = async () => {
        if (title && meetLink && dateTime && currentUser) {
            await addMeeting({ teamId, title, meetLink, dateTime, createdBy: currentUser.id });
            setModalOpen(false);
            setTitle(''); setMeetLink(''); setDateTime('');
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Reuniões Agendadas</h2>
                <Button onClick={() => setModalOpen(true)}><PlusIcon className="w-4 h-4"/> Agendar Reunião</Button>
            </div>
            <div className="space-y-4">
                {meetings.length > 0 ? meetings.map(m => (
                    <Card key={m.id}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{m.title}</h3>
                                <p className="text-dark-text text-sm">{new Date(m.dateTime).toLocaleString('pt-BR')}</p>
                            </div>
                            <a href={m.meetLink} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                <Button>Entrar na Reunião</Button>
                            </a>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-dark-text shrink-0"/>
                            <a href={m.meetLink} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline truncate" title={m.meetLink}>
                                {m.meetLink}
                            </a>
                        </div>
                    </Card>
                )) : <p className="text-dark-text">Nenhuma reunião agendada.</p>}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Agendar Nova Reunião">
                <div className="space-y-4">
                    <Input label="Título da Reunião" value={title} onChange={e => setTitle(e.target.value)} />
                    <Input label="Link do Google Meet" value={meetLink} onChange={e => setMeetLink(e.target.value)} />
                    <Input label="Data e Hora" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
                    <Button onClick={handleSubmit} className="w-full">Agendar</Button>
                </div>
            </Modal>
        </div>
    );
};

const DocumentsView: React.FC<{teamId: string}> = ({ teamId }) => {
    const { getTeamDocuments, addDocument, currentUser } = useAppContext();
    const documents = getTeamDocuments(teamId);
    const [isModalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [isProtected, setIsProtected] = useState(false);
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if(name && content && currentUser) {
            await addDocument({ teamId, name, content, passwordProtected: isProtected, password: isProtected ? password : undefined, createdBy: currentUser.id });
            setModalOpen(false);
            setName(''); setContent(''); setIsProtected(false); setPassword('');
        }
    }
    
    const handleDocClick = (doc: ReturnType<typeof getTeamDocuments>[0]) => {
        if(doc.passwordProtected) {
            const enteredPass = prompt('Este documento é protegido por senha. Por favor, digite a senha:');
            if(enteredPass === doc.password) {
                alert(`Conteúdo do Documento:\n\n${doc.content}`);
            } else {
                alert('Senha incorreta.');
            }
        } else {
            alert(`Conteúdo do Documento:\n\n${doc.content}`);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Documentos</h2>
                <Button onClick={() => setModalOpen(true)}><PlusIcon className="w-4 h-4"/> Adicionar Documento</Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.length > 0 ? documents.map(d => (
                    <Card key={d.id} className="cursor-pointer transition-all duration-300 hover:bg-slate-700 hover:scale-105" onClick={() => handleDocClick(d)}>
                        <div className="flex items-center justify-between">
                             <h3 className="font-bold truncate">{d.name}</h3>
                            {d.passwordProtected ? <LockIcon className="w-5 h-5 text-dark-text" /> : <UnlockIcon className="w-5 h-5 text-dark-text"/>}
                        </div>
                    </Card>
                )) : <p className="text-dark-text col-span-full">Nenhum documento encontrado.</p>}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Adicionar Novo Documento">
                <div className="space-y-4">
                    <Input label="Nome do Documento" value={name} onChange={e => setName(e.target.value)} />
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Conteúdo do documento..." className="w-full bg-primary border border-slate-600 rounded-md px-3 py-2 text-light placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent" rows={5}></textarea>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="protected" checked={isProtected} onChange={e => setIsProtected(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"/>
                        <label htmlFor="protected" className="text-sm">Proteger com senha</label>
                    </div>
                    {isProtected && <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />}
                    <Button onClick={handleSubmit} className="w-full">Adicionar Documento</Button>
                </div>
            </Modal>
        </div>
    );
};


const LockersView: React.FC<{teamId: string}> = ({ teamId }) => {
    const { getTeamFiles, addFile, currentUser } = useAppContext();
    const files = getTeamFiles(teamId);
    const [isModalOpen, setModalOpen] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState<'link' | 'upload'>('link');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileUrl(event.target?.result as string);
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const getFileType = (name: string): 'pdf' | 'image' | 'video' | 'other' => {
        if (/\.(jpe?g|png|gif|svg)$/i.test(name)) return 'image';
        if (/\.pdf$/i.test(name)) return 'pdf';
        if (/\.(mp4|mov|avi)$/i.test(name)) return 'video';
        return 'other';
    };

    const handleSubmit = async () => {
        if (!fileName || !fileUrl || !currentUser) return;
        const type = fileType === 'link' ? 'link' : getFileType(fileName);
        await addFile({ teamId, name: fileName, type, url: fileUrl, createdBy: currentUser.id });
        setModalOpen(false);
        setFileName(''); setFileUrl(''); setFileType('link');
    }

    const getFileIcon = (type: ReturnType<typeof getFileType> | 'link') => {
        switch(type) {
            case 'image': return <FileTextIcon className="w-8 h-8 text-green-400"/>;
            case 'pdf': return <FileTextIcon className="w-8 h-8 text-red-400"/>;
            case 'video': return <FileTextIcon className="w-8 h-8 text-blue-400"/>;
            case 'link': return <LinkIcon className="w-8 h-8 text-yellow-400"/>;
            default: return <FileTextIcon className="w-8 h-8 text-dark-text"/>;
        }
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Armários Online</h2>
                <Button onClick={() => setModalOpen(true)}><PlusIcon className="w-4 h-4"/> Adicionar Arquivo</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {files.length > 0 ? files.map(f => (
                    <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Card className="flex flex-col items-center justify-center p-4 gap-2 aspect-square transition-all duration-300 hover:bg-slate-700 hover:scale-105">
                        {getFileIcon(f.type)}
                        <p className="text-sm text-center break-all truncate w-full">{f.name}</p>
                    </Card>
                    </a>
                )) : <p className="text-dark-text col-span-full">O armário está vazio.</p>}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Adicionar ao Armário">
                <div className="space-y-4">
                    <div className="flex border-b border-slate-600 mb-4">
                        <button onClick={() => setFileType('link')} className={`flex-1 py-2 font-semibold ${fileType === 'link' ? 'text-accent border-b-2 border-accent' : 'text-dark-text'}`}>Link</button>
                        <button onClick={() => setFileType('upload')} className={`flex-1 py-2 font-semibold ${fileType === 'upload' ? 'text-accent border-b-2 border-accent' : 'text-dark-text'}`}>Upload</button>
                    </div>
                    {fileType === 'link' ? (
                        <>
                         <Input label="Nome" value={fileName} onChange={e => setFileName(e.target.value)} />
                         <Input label="URL" value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
                        </>
                    ) : (
                        <>
                         <Input label="Arquivo" type="file" onChange={handleFileChange} ref={fileInputRef}/>
                         {fileName && <p className="text-sm text-dark-text">Selecionado: {fileName}</p>}
                        </>
                    )}

                    <Button onClick={handleSubmit} className="w-full">Adicionar ao Armário</Button>
                </div>
            </Modal>
        </div>
    );
};

const ChatView: React.FC<{teamId: string}> = ({ teamId }) => {
    const { getTeam, getUser, getTeamMessages, addMessage, currentUser } = useAppContext();
    const team = getTeam(teamId);
    const [activeChannel, setActiveChannel] = useState('public');
    const [message, setMessage] = useState('');
    const messages = getTeamMessages(teamId, activeChannel);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (message.trim() && currentUser) {
            await addMessage({ teamId, channelId: activeChannel, senderId: currentUser.id, content: message, timestamp: new Date().toISOString() });
            setMessage('');
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] flex border border-slate-700 rounded-lg">
            <div className="w-1/4 border-r border-slate-700 p-4 overflow-y-auto">
                <h3 className="font-bold mb-2">Canais</h3>
                <button onClick={() => setActiveChannel('public')} className={`w-full text-left p-2 rounded ${activeChannel === 'public' ? 'bg-accent text-primary' : 'hover:bg-slate-700'}`}># Geral</button>
                <h3 className="font-bold mt-4 mb-2">Mensagens Diretas</h3>
                {team?.members.filter(m => m.userId !== currentUser?.id).map(m => {
                    const user = getUser(m.userId);
                    return (
                        <button key={m.userId} onClick={() => setActiveChannel(m.userId)} className={`w-full text-left p-2 rounded ${activeChannel === m.userId ? 'bg-accent text-primary' : 'hover:bg-slate-700'}`}>
                            {user?.name}
                        </button>
                    )
                })}
            </div>
            <div className="flex-1 flex flex-col bg-secondary rounded-r-lg">
                <div className="p-4 flex-1 overflow-y-auto">
                    {messages.map(msg => {
                        const sender = getUser(msg.senderId);
                        const isMe = sender?.id === currentUser?.id;
                        return (
                             <div key={msg.id} className={`flex gap-3 my-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-sm shrink-0">{sender?.name.charAt(0)}</div>}
                                <div className={`p-3 rounded-lg max-w-lg ${isMe ? 'bg-accent text-primary' : 'bg-slate-700'}`}>
                                    {!isMe && <p className="font-bold text-sm text-accent">{sender?.name}</p>}
                                    <p>{msg.content}</p>
                                    <p className={`text-xs opacity-70 mt-1 ${isMe ? '' : 'text-right'}`}>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                        );
                    })}
                     <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-slate-700 flex gap-2">
                    <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Digite uma mensagem..." className="flex-1" />
                    <Button onClick={handleSend}><SendIcon className="w-5 h-5"/></Button>
                </div>
            </div>
        </div>
    );
};

const MembersView: React.FC<{teamId: string}> = ({ teamId }) => {
    const { getTeam, getUser, currentUser, updateUserRole, addTeamMember, removeTeamMember, deleteTeam } = useAppContext();
    const navigate = useNavigate();
    const team = getTeam(teamId);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [emailToAdd, setEmailToAdd] = useState('');
    const [addMemberError, setAddMemberError] = useState('');

    if (!team || !currentUser) return null;
    
    const currentUserMembership = team.members.find(m => m.userId === currentUser.id);
    const currentUserRole = currentUserMembership?.role;
    const isOwner = currentUserRole === Role.OWNER;
    const isSubAdmin = currentUserRole === Role.SUB_ADMIN;
    const canManageMembers = isOwner || isSubAdmin;

    const handleAddMember = async () => {
        if (!emailToAdd) return;
        setAddMemberError('');
        const result = await addTeamMember(teamId, emailToAdd);
        if (result.success) {
            setAddModalOpen(false);
            setEmailToAdd('');
        } else {
            setAddMemberError(result.message);
        }
    }

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (window.confirm(`Tem certeza que deseja remover ${userName} do time?`)) {
            await removeTeamMember(teamId, userId);
        }
    }

    const handleDeleteTeam = async () => {
        const confirmation = prompt(`Esta ação é irreversível e vai apagar todas as reuniões, documentos e arquivos. Para confirmar, digite o nome do time: "${team.name}"`);
        if (confirmation === team.name) {
            await deleteTeam(teamId);
            alert('Time apagado com sucesso.');
            navigate('/dashboard');
        } else if (confirmation !== null) {
            alert('O nome do time não confere. Ação cancelada.');
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Membros do Time ({team.members.length})</h2>
                {canManageMembers && (
                    <Button onClick={() => setAddModalOpen(true)}><PlusIcon className="w-4 h-4"/> Adicionar Membro</Button>
                )}
            </div>
            <div className="bg-secondary rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Cargo</th>
                            {canManageMembers && <th className="p-3 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {team.members.map(member => {
                            const user = getUser(member.userId);
                            if (!user) return null;
                            const roleLabels = {
                                [Role.OWNER]: 'Dono',
                                [Role.SUB_ADMIN]: 'Sub-Admin',
                                [Role.MEMBER]: 'Membro'
                            };
                            const canBeRemoved = member.role !== Role.OWNER && (isOwner || (isSubAdmin && member.role === Role.MEMBER));

                            return (
                                <tr key={user.id} className="border-b border-slate-700 last:border-0">
                                    <td className="p-3">{user.name}</td>
                                    <td className="p-3 text-dark-text">{user.email}</td>
                                    <td className="p-3 capitalize">{roleLabels[member.role]}</td>
                                    {canManageMembers && (
                                        <td className="p-3 text-right space-x-2">
                                            {isOwner && member.role !== Role.OWNER ? (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => updateUserRole(teamId, user.id, e.target.value as Role)}
                                                    className="bg-primary border border-slate-600 rounded-md px-2 py-1"
                                                >
                                                    <option value={Role.MEMBER}>Membro</option>
                                                    <option value={Role.SUB_ADMIN}>Sub-Admin</option>
                                                </select>
                                            ) : null}

                                            {canBeRemoved ? (
                                                <Button variant="danger" onClick={() => handleRemoveMember(user.id, user.name)} className="px-2 py-1 !inline-flex">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </Button>
                                            ) : null }

                                            {member.role === Role.OWNER && <span>-</span>}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {isOwner && (
                <div className="mt-8 border-t border-red-800/50 pt-6">
                    <h3 className="text-lg font-semibold text-red-400">Zona de Perigo</h3>
                    <p className="text-sm text-dark-text mb-4">Esta ação não pode ser desfeita.</p>
                    <Button variant="danger" onClick={handleDeleteTeam}>
                        Apagar este Time Permanentemente
                    </Button>
                </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => { setAddModalOpen(false); setAddMemberError(''); }} title="Adicionar Novo Membro">
                <div className="space-y-4">
                    <Input 
                        label="Email do Usuário" 
                        type="email" 
                        value={emailToAdd} 
                        onChange={e => setEmailToAdd(e.target.value)} 
                        placeholder="exemplo@email.com"
                    />
                    {addMemberError && <p className="text-red-500 text-sm">{addMemberError}</p>}
                    <Button onClick={handleAddMember} className="w-full">Adicionar Membro</Button>
                </div>
            </Modal>
        </div>
    );
};

export default TeamPage;