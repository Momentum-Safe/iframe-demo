import { Connector } from "./connector";
import { JsonRPCClient } from "./JsonRPCClient";
import { Account, WalletAPI, Option, Payload } from "./WalletAPI";
type onEventFunc = (data: any) => void;

const MsafeOrigin = 'http://localhost:3000';
export class MsafeWallet implements WalletAPI {
    static ChangeAccountEvent = 'ChangeAccount';
    static ChangeNetworkEvent = 'ChangeNetwork';
    public client: JsonRPCClient;
    events: { [key: string]: onEventFunc } = {};
    constructor(connector: Connector) {
        const onEvent = (type: string, ...params: any[]) => {
            const cbk = this.events[type];
            cbk && cbk(params[0]);
        };
        const entries = [
            MsafeWallet.ChangeAccountEvent, 
            MsafeWallet.ChangeNetworkEvent
        ].map(event => [event, (...params: any[]) => onEvent(event, ...params)]);
        const notifiers = Object.fromEntries(entries);
        this.client = new JsonRPCClient(connector, notifiers);
    }
    async connect(): Promise<Account> {
        return this.client.request('connect');
    }
    async isConnected() {
        return this.client.request('isConnected');
    }
    async disconnect() {
        return this.client.request('disconnect');
    }
    onChangeAccount(cbk: (account: Account) => void) {
        this.events[MsafeWallet.ChangeAccountEvent] = cbk;
    }
    onChangeNetwork(cbk: (network: string) => void) {
        this.events[MsafeWallet.ChangeNetworkEvent] = cbk;
    }
    async network(): Promise<string> {
        return this.client.request('network');
    }
    async account(): Promise<Account> {
        return this.client.request('account');
    }
    async chainId(): Promise<Number> {
        return this.client.request('chainId');
    }
    async signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.client.request('signAndSubmit', [payload, option]);
    }

    async signTransaction(payload: Payload, option?: Option): Promise<Uint8Array> {
        return this.client.request('signTransaction', [payload, option]);
    }

    async signMessage(message: string | Uint8Array): Promise<Uint8Array> {
        return this.client.request('signMessage', [message]);
    }
    static async new(msafe=MsafeOrigin): Promise<MsafeWallet> {
        const connector = await Connector.connect(window.parent, msafe);
        return new MsafeWallet(connector);
    }
}
