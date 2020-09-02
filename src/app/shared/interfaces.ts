export interface User {
  name: string;
  wifiName: string;
  wifiPassword: string;
}

export interface ServerUser {
  id: string;
  name: string;
}

export enum userType {
  USER = 'user',
  DOC = 'doc',
  DEVICE = 'device'
}
