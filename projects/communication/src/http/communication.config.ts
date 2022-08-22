export interface ICommunicationHttpConfig {
  identity: string;
}

export interface ICommunicationWsConfig {
  url: string;
}

export interface ICommunicationConfig {
  http: ICommunicationHttpConfig;
  ws: ICommunicationWsConfig;
}

export class CommunicationConfig {
  http!: ICommunicationHttpConfig;
  ws!: ICommunicationWsConfig;
}

export interface IIdentityConfig {
  url: string;
  scope: string[];
  clientId: string;
  clientSecret: string;
  responseType: string;
  redirectUri: string;
  notificationUri: string;
}
