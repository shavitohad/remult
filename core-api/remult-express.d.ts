import * as express from 'express';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
import { Remult } from './src/context';
import { ServerEventChannelSubscribeDTO } from './src/live-query/LiveQuerySubscriber';
import { SubscriptionServer } from './src/live-query/LiveQueryPublisher';
import { MessagePublisher } from './live-query';
export declare function remultExpress(options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
    subscriptionServer?: (router: express.Router, server: RemultServer) => MessagePublisher;
}): express.RequestHandler & RemultServer;
export declare class ServerEventsController implements SubscriptionServer {
    private canUserConnectToChannel?;
    subscribeToChannel({ channel, clientId }: ServerEventChannelSubscribeDTO, res: import('express').Response, remult: Remult, remove?: boolean): void;
    connections: clientConnection[];
    constructor(canUserConnectToChannel?: (channel: string, remult: Remult) => boolean);
    publishMessage<T>(channel: string, message: any): void;
    debugMessageFileSaver: (id: any, channel: any, message: any) => void;
    openHttpServerStream(req: import('express').Request, res: import('express').Response): clientConnection;
    debug(): void;
    debugFileSaver: (x: any) => void;
}
declare class clientConnection {
    response: import('express').Response;
    channels: Record<string, boolean>;
    close(): void;
    closed: boolean;
    write(eventData: string, eventType?: string): void;
    connectionId: any;
    constructor(response: import('express').Response);
    sendLiveMessage(): void;
}
export {};
