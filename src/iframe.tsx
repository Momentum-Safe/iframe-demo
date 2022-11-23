import {
    BCS,
    TransactionBuilderRemoteABI,
    TxnBuilderTypes,
    AptosClient,
} from "aptos";
import { useCallback, useEffect, useRef, useState } from "react";
import { Connector,MsafeServer,WalletRPC } from "msafe-iframe";
import { Payload, Option, Account } from "msafe-iframe";


const aptosClient = new AptosClient(
    "https://fullnode.testnet.aptoslabs.com/v1"
);

// REVIEW: What is this used for?
const dappUrl = window.origin.includes("localhost")
    ? window.origin.replace("localhost", "127.0.0.1")
    : window.origin.replace("127.0.0.1", "localhost");

async function buildTransaction(
    payload: Payload,
    option?: Option
): Promise<TxnBuilderTypes.RawTransaction> {
    if (payload instanceof Uint8Array) {
        const deserializer = new BCS.Deserializer(payload);
        return TxnBuilderTypes.RawTransaction.deserialize(deserializer);
    }
    const txnBuilder = new TransactionBuilderRemoteABI(aptosClient, option!);
    const moduleId = TxnBuilderTypes.ModuleId.fromStr(payload.function);
    return txnBuilder.build(
        moduleId.name.value,
        payload.type_arguments,
        payload.arguments
    );
}

export function IFrame() {
    const iframeRef = useRef(null);
    const [enIframe, setEnIframe] = useState(false);
    const [msafe, setMsafe] = useState<MsafeServer>();
    const [request, setRequest] = useState<string>();

    const accept = useCallback(() => {
        const cleaner = Connector.accepts(dappUrl, (connector) => {
            const webWallet = (window as any).martian;
            const server = new MsafeServer(connector, {
                async connect(): Promise<Account> {
                    setRequest(WalletRPC.connect);
                    // should return msafe address and public key;
                    return webWallet.connect();
                },
                async disconnect(): Promise<void> {
                    setRequest(WalletRPC.disconnect);
                    return webWallet.disconnect();
                },
                async isConnected(): Promise<boolean> {
                    setRequest(WalletRPC.isConnected);
                    return webWallet.isConnected();
                },
                async network(): Promise<string> {
                    setRequest(WalletRPC.network);
                    return webWallet.network();
                },
                async account(): Promise<Account> {
                    setRequest(WalletRPC.account);
                    // should return msafe address and public key;
                    return webWallet.account();
                },
                async chainId(): Promise<Number> {
                    setRequest(WalletRPC.chainId);
                    return webWallet.getChainId().then((r: any) => r.chainId);
                },
                async signAndSubmit(
                    payload: Payload,
                    option?: Option
                ): Promise<Uint8Array> {
                    setRequest(WalletRPC.signAndSubmit);
                    const txn = await buildTransaction(payload, option);
                    console.log("signAndSubmit:", BCS.bcsToBytes(txn));
                    // msafe.init_transaction(txn);
                    // msafe.submit_signature();
                    // txhash = clien.submitBCSTranscion(...);
                    // ...
                    const fakeTxHash = new Uint8Array(32);
                    fakeTxHash.set(BCS.bcsToBytes(txn.payload).subarray(0, 32));
                    return fakeTxHash;
                },
                async signTransaction(
                    payload: Payload,
                    option?: Option
                ): Promise<Uint8Array> {
                    setRequest(WalletRPC.signTransaction);
                    const txn = await buildTransaction(payload, option);
                    console.log("signTransaction:", BCS.bcsToBytes(txn));
                    // msafe.init_transaction(txn);
                    // msafe.submit_signature();
                    // multiTxn =
                    const fakeSignedTxn = txn;
                    return BCS.bcsToBytes(fakeSignedTxn);
                },
                async signMessage(
                    message: string | Uint8Array
                ): Promise<Uint8Array> {
                    setRequest(WalletRPC.signMessage);
                    throw Error("unsupport");
                },
            });

            setMsafe(server);
            webWallet.onNetworkChange((network: any) => {
                server.changeNetwork(network);
            });
            webWallet.onAccountChange((account: any) => {
                server.changeAccount(account);
            });
        });
        return cleaner;
    }, []);
    // msafe accpet connection
    useEffect(() => {
        const cleaner = accept();
        return () => {
            cleaner();
            msafe && msafe.server.connector.close();
        };
    }, [accept, msafe]);
    return (
        <>
            <p>===================msafe frame: {window.location.href}</p>
            <p>
                handshake:
                {msafe && msafe.server.connector.connected
                    ? "connected"
                    : "disconnected"}
            </p>
            {!(msafe && msafe.server.connector.connected) ? (
                <button onClick={() => setEnIframe(true)}>load iframe</button>
            ) : (
                <button
                    onClick={() =>
                        msafe && msafe.changeNetwork(window.location.href)
                    }
                >
                    notify
                </button>
            )}
            <p>request: {request}</p>
            {enIframe && (
                <iframe
                    ref={iframeRef}
                    title="Dapp"
                    width="100%"
                    height="400hv"
                    src={dappUrl + "/child"}
                />
            )}
        </>
    );
}

export default IFrame;
