import { Role, User, Team, Meeting, Document, FileLockerItem, ChatMessage, TeamMember } from '../types';

declare const initSqlJs: any;

// Helper to convert SQL.js output to an array of objects
const parseResults = <T>(results: any[]): T[] => {
  if (results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map(row => {
    const obj: { [key: string]: any } = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
};


export class DB {
  private db: any;
  private isInitialized = false;

  constructor() {}

  async init() {
    if (this.isInitialized) return;
    
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const storedDb = localStorage.getItem('collaborax_db');
    if (storedDb) {
        this.db = new SQL.Database(this.base64ToUint8Array(storedDb));
    } else {
        this.db = new SQL.Database();
        this.createTables();
    }
    this.isInitialized = true;
  }

  private save() {
    const dbArray = this.db.export();
    localStorage.setItem('collaborax_db', this.uint8ArrayToBase64(dbArray));
  }
  
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE users (
          id TEXT PRIMARY KEY, 
          name TEXT, 
          email TEXT UNIQUE, 
          password TEXT
      );
      CREATE TABLE teams (
          id TEXT PRIMARY KEY, 
          name TEXT, 
          ownerId TEXT
      );
      CREATE TABLE team_members (
          teamId TEXT, 
          userId TEXT, 
          role TEXT, 
          PRIMARY KEY (teamId, userId)
      );
      CREATE TABLE meetings (
          id TEXT PRIMARY KEY, 
          teamId TEXT, 
          title TEXT, 
          meetLink TEXT, 
          dateTime TEXT, 
          createdBy TEXT
      );
      CREATE TABLE documents (
          id TEXT PRIMARY KEY, 
          teamId TEXT, 
          name TEXT, 
          content TEXT, 
          passwordProtected INTEGER, 
          password TEXT, 
          createdBy TEXT
      );
      CREATE TABLE files (
          id TEXT PRIMARY KEY, 
          teamId TEXT, 
          name TEXT, 
          type TEXT, 
          url TEXT, 
          createdBy TEXT
      );
      CREATE TABLE messages (
          id TEXT PRIMARY KEY, 
          teamId TEXT, 
          channelId TEXT, 
          senderId TEXT, 
          content TEXT, 
          timestamp TEXT
      );
    `);
    this.save();
  }

  // --- Auth & User Queries ---
  signup(user: Omit<User, 'id'>): boolean {
    try {
      this.db.run('INSERT INTO users VALUES (?, ?, ?, ?)', [`user_${Date.now()}`, user.name, user.email, user.password]);
      this.save();
      return true;
    } catch (e) {
      console.error("Signup failed", e);
      return false;
    }
  }

  login(email: string, pass: string): User | null {
    const res = this.db.exec("SELECT * FROM users WHERE email = ? AND password = ?", [email, pass]);
    return parseResults<User>(res)[0] || null;
  }
  
  private getUserByEmail(email: string): User | null {
    const res = this.db.exec("SELECT id, name, email FROM users WHERE email = ?", [email]);
    return parseResults<User>(res)[0] || null;
  }

  // --- Getters ---
  getUsers(): User[] {
    return parseResults<User>(this.db.exec("SELECT id, name, email FROM users"));
  }

  getTeams(): Team[] {
    const teams = parseResults<Team>(this.db.exec("SELECT * FROM teams"));
    const members = parseResults<TeamMember & {teamId: string}>(this.db.exec("SELECT * FROM team_members"));
    return teams.map(team => ({
        ...team,
        members: members.filter(m => m.teamId === team.id).map(({teamId, ...rest}) => rest)
    }));
  }

  getMeetings(): Meeting[] {
    return parseResults<Meeting>(this.db.exec("SELECT * FROM meetings"));
  }
  
  getDocuments(): Document[] {
    const docs = parseResults<any>(this.db.exec("SELECT * FROM documents"));
    return docs.map((d: any) => ({
      ...d,
      passwordProtected: d.passwordProtected === 1,
    }));
  }
  
  getFiles(): FileLockerItem[] {
    return parseResults<FileLockerItem>(this.db.exec("SELECT * FROM files"));
  }
  
  getMessages(): ChatMessage[] {
    return parseResults<ChatMessage>(this.db.exec("SELECT * FROM messages"));
  }

  // --- Mutations ---
  createTeam(name: string, owner: User) {
    const teamId = `team_${Date.now()}`;
    this.db.run('INSERT INTO teams VALUES (?, ?, ?)', [teamId, name, owner.id]);
    this.db.run('INSERT INTO team_members VALUES (?, ?, ?)', [teamId, owner.id, Role.OWNER]);
    this.save();
  }

  addTeamMember(teamId: string, email: string): { success: boolean; message: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
        return { success: false, message: 'Usuário não encontrado.' };
    }

    const team = this.getTeams().find(t => t.id === teamId);
    if (team?.members.some(m => m.userId === user.id)) {
        return { success: false, message: 'Usuário já é membro deste time.' };
    }

    try {
        this.db.run('INSERT INTO team_members VALUES (?, ?, ?)', [teamId, user.id, Role.MEMBER]);
        this.save();
        return { success: true, message: 'Membro adicionado com sucesso!' };
    } catch (e) {
        console.error("Failed to add team member", e);
        return { success: false, message: 'Ocorreu um erro ao adicionar o membro.' };
    }
  }

  removeTeamMember(teamId: string, userId: string) {
      this.db.run('DELETE FROM team_members WHERE teamId = ? AND userId = ?', [teamId, userId]);
      this.save();
  }

  deleteTeam(teamId: string) {
      const tables = ['teams', 'team_members', 'meetings', 'documents', 'files', 'messages'];
      const column = ['id', 'teamId', 'teamId', 'teamId', 'teamId', 'teamId'];

      for (let i = 0; i < tables.length; i++) {
          this.db.run(`DELETE FROM ${tables[i]} WHERE ${column[i]} = ?`, [teamId]);
      }
      this.save();
  }
  
  addMeeting(meeting: Omit<Meeting, 'id'>) {
      this.db.run('INSERT INTO meetings VALUES (?, ?, ?, ?, ?, ?)', [`meet_${Date.now()}`, meeting.teamId, meeting.title, meeting.meetLink, meeting.dateTime, meeting.createdBy]);
      this.save();
  }

  addDocument(doc: Omit<Document, 'id'>) {
      this.db.run('INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?)', [`doc_${Date.now()}`, doc.teamId, doc.name, doc.content, doc.passwordProtected ? 1 : 0, doc.password, doc.createdBy]);
      this.save();
  }
  
  addFile(file: Omit<FileLockerItem, 'id'>) {
      this.db.run('INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)', [`file_${Date.now()}`, file.teamId, file.name, file.type, file.url, file.createdBy]);
      this.save();
  }

  addMessage(msg: Omit<ChatMessage, 'id'>) {
      this.db.run('INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)', [`msg_${Date.now()}`, msg.teamId, msg.channelId, msg.senderId, msg.content, msg.timestamp]);
      this.save();
  }
  
  updateUserRole(teamId: string, userId: string, role: Role) {
      this.db.run('UPDATE team_members SET role = ? WHERE teamId = ? AND userId = ?', [role, teamId, userId]);
      this.save();
  }

}

export const dbService = new DB();