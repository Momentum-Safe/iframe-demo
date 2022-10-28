import { Connector } from "./connector";
import { JsonRPCServer } from "./JsonRPCServer";
import { Account, WalletAPI } from "./WalletAPI";

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