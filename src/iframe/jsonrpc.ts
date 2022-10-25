import { Connector } from "./connector";
import { JsonRpcParamsSchemaByPositional, JsonRpcPayloadRequest, parse, format, JsonRpcPayloadResponse, JsonRpcPayloadNotification, JsonRpcError, JsonRpcPayloadError } from 'json-rpc-protocol'

type RPCResponse = (response: any, err?: boolean) => void;
type RPCMethod = (response: RPCResponse, ...params: any[]) => void;

export class JsonRPCServer {
    constructor(readonly connector: Connector, readonly methods: { [method: string]: RPCMethod }) {
        this.connector.on('message', data => this.onRequest(data!));
        this.connector.on('close', () => this.onClose());
    }
    private onRequest(data: string) {
        const req = parse(data) as JsonRpcPayloadRequest;
        if (req.type !== 'request') return;
        const method = this.methods[req.method];
        method((response, err) => {
            const resp = err ? format.error(req.id, new JsonRpcError(response)) : format.response(req.id, response);
            this.connector.send(resp);
        }, ...req.params as JsonRpcParamsSchemaByPositional);
    }
    notify(type: string, ...data: any[]) {
        const notification = format.notification(type, data);
        this.connector.send(notification);
    }
    private onClose() {

    }
}

type executorFunc = (data: any) => void;
type executor = { resolve: executorFunc, reject: executorFunc };
type notifier = (...params: any[])=>void;

export class JsonRPCClient {
    id: number = 0;
    executors: { [id: number]: executor } = {};
    constructor(readonly connector: Connector, readonly notifiers:{[type:string]:notifier}) {
        this.connector.on('message', data => this.onMessage(data!));
        this.connector.on('close', () => this.onClose());
    }
    private onMessage(data: string) {
        const mesg = parse(data) as JsonRpcPayloadResponse | JsonRpcPayloadNotification | JsonRpcPayloadError;
        switch (mesg.type) {
            case 'notification':
                return this.onNotify(mesg.method, mesg.params as JsonRpcParamsSchemaByPositional);
            case 'response':
                return this.executors[Number(mesg.id)]?.resolve(mesg.result);
            case 'error':
                return this.executors[Number(mesg.id)]?.reject(mesg.error);
        }

    }
    async request(method: string, params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const reqId = this.id++;
            this.executors[reqId] = { resolve, reject };
            const req = format.request(reqId, method, params);
            this.connector.send(req);
        });
    }
    private onNotify(type: string, data: any[]) {
        this.notifiers[type](...data);
    }
    private onClose() {

    }
}