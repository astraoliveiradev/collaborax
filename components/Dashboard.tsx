import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { Card } from './UI';
import { CalendarIcon, FileTextIcon, UsersIcon } from './Icons';

const DashboardPage: React.FC = () => {
  const { currentUser, teams, meetings, documents } = useAppContext();
  const userTeams = currentUser ? teams.filter(t => t.members.some(m => m.userId === currentUser.id)) : [];
  const userTeamIds = userTeams.map(t => t.id);
  const upcomingMeetings = meetings
    .filter(m => userTeamIds.includes(m.teamId) && new Date(m.dateTime) > new Date())
    .slice(0, 3);
  const recentDocuments = documents.filter(d => userTeamIds.includes(d.teamId)).slice(0, 3);

  return (
    <div className="space-y-6 animate-slideInUp">
      <h1 className="text-3xl font-bold text-light">Bem-vindo(a) de volta, {currentUser?.name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 transition-transform duration-300 hover:scale-105" style={{ animationDelay: '100ms' }}>
          <div className="p-3 bg-slate-700 rounded-full">
            <UsersIcon className="w-8 h-8 text-accent"/>
          </div>
          <div>
            <p className="text-dark-text">Total de Times</p>
            <p className="text-2xl font-bold">{userTeams.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 transition-transform duration-300 hover:scale-105" style={{ animationDelay: '200ms' }}>
          <div className="p-3 bg-slate-700 rounded-full">
            <CalendarIcon className="w-8 h-8 text-accent"/>
          </div>
          <div>
            <p className="text-dark-text">Próximas Reuniões</p>
            <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 transition-transform duration-300 hover:scale-105" style={{ animationDelay: '300ms' }}>
          <div className="p-3 bg-slate-700 rounded-full">
            <FileTextIcon className="w-8 h-8 text-accent"/>
          </div>
          <div>
            <p className="text-dark-text">Total de Documentos</p>
            <p className="text-2xl font-bold">{documents.filter(d => userTeamIds.includes(d.teamId)).length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ animationDelay: '400ms' }}>
          <h2 className="text-xl font-semibold mb-4">Próximas Reuniões</h2>
          {upcomingMeetings.length > 0 ? (
            <ul className="space-y-3">
              {upcomingMeetings.map(meeting => (
                <li key={meeting.id} className="p-3 bg-primary rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{meeting.title}</p>
                    <p className="text-sm text-dark-text">{new Date(meeting.dateTime).toLocaleString()}</p>
                  </div>
                  <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm font-bold">Entrar</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-dark-text">Nenhuma reunião agendada.</p>
          )}
        </Card>
        
        <Card style={{ animationDelay: '500ms' }}>
          <h2 className="text-xl font-semibold mb-4">Documentos Recentes</h2>
          {recentDocuments.length > 0 ? (
            <ul className="space-y-3">
              {recentDocuments.map(doc => {
                const team = teams.find(t => t.id === doc.teamId);
                return (
                  <li key={doc.id} className="p-3 bg-primary rounded-md">
                    <p className="font-semibold">{doc.name}</p>
                    <p className="text-sm text-dark-text">No time <Link to={`/team/${team?.id}`} className="hover:underline text-accent">{team?.name}</Link></p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-dark-text">Nenhum documento recente.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;