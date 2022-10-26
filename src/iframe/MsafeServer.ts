import { Connector } from "./connector";
import { JsonRPCServer } from "./JsonRPCServer";
import { Payload } from "./payload";

export type Account = {
    address: string,
    publicKey: string,
}

export type Option = {
    max_gas_amount: string,
    gas_unit_price: string,
    expiration_timestamp_secs: string,
    sequence_number: string,
    sender: string,
}

export interface WalletAPI {
    /*
    connect(): Promise<Account>;
    disconnect(): Promise<void>,
    network(): Promise<string>,
    account(): Promise<Account>,
    chainId(): Promise<Number>,
    signAndSubmit(payload: Payload, option?: Option): Promise<Uint8Array>,
    */
    signTransaction(payload: Payload, option?: Option): Promise<Uint8Array>,
    //signMessage(message: string | Uint8Array): Promise<Uint8Array>,
}

export class MsafeServer {
    public server: JsonRPCServer;
    constructor(connector: Connector, methods: WalletAPI) {
        this.server = new JsonRPCServer(connector, methods as any);
    }
    changeNetwork(network: string) {
        this.server.notify('ChangeNetwork', [network]);
    }
    changeAccount(account: Account) {
        this.server.notify('ChangeAccount', [account]);
    }
}