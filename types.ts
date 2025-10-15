
export enum Role {
  OWNER = 'owner',
  SUB_ADMIN = 'sub-admin',
  MEMBER = 'member',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only for mock auth
}

export interface TeamMember {
  userId: string;
  role: Role;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
}

export interface Meeting {
  id: string;
  teamId: string;
  title: string;
  meetLink: string;
  dateTime: string;
  createdBy: string;
}

export interface Document {
  id: string;
  teamId: string;
  name: string;
  content: string; // Mock content
  passwordProtected: boolean;
  password?: string;
  createdBy: string;
}

export interface FileLockerItem {
  id: string;
  teamId: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'link' | 'other';
  url: string; // data URL or external link
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  channelId: string; // 'public' or userId for DMs
  senderId: string;
  content: string;
  timestamp: string;
}
