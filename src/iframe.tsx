import {
    BCS,
    TransactionBuilderRemoteABI,
    TxnBuilderTypes,
    AptosClient,
} from "aptos";
import { useCallback, useEffect, useRef, useState } from "react";
import { Connector, MSafeServer, WalletRPC } from "msafe-wallet";
import { Payload, Option, Account } from "msafe-wallet";
import { dappUrl } from "./dappURL";

const aptosClient = new AptosClient(
    "https://fullnode.testnet.aptoslabs.com/v1"
);


async function buildTransaction(
    payload: Payload,
    option?: Option & {sender: string},
): Promise<TxnBuilderTypes.RawTransaction> {
    if (payload instanceof Uint8Array) {
        const deserializer = new BCS.Deserializer(payload);
        return TxnBuilderTypes.RawTransaction.deserialize(deserializer);
    }

    const builderOption = {
        sender: option!.sender,
        sequenceNumber: option?.sequence_number,
        gasUnitPrice: option?.gas_unit_price,
        maxGasAmount: option?.max_gas_amount,
    };

    option?.sequence_number || delete builderOption.sequenceNumber;
    option?.gas_unit_price || delete builderOption.gasUnitPrice;
    option?.max_gas_amount || delete builderOption.maxGasAmount;

    const txnBuilder = new TransactionBuilderRemoteABI(aptosClient, builderOption);

    const tx = await txnBuilder.build(
        payload.function,
        payload.type_arguments,
        payload.arguments
    ).catch((e) => {
        console.error(e);
        throw e;
    });

    if(option?.expiration_timestamp_secs)
        (tx as any).expiration_timestamp_secs = option.expiration_timestamp_secs;
    return tx;
}

let no = 0;

export function IFrame() {
    const iframeRef = useRef(null);
    const [enIframe, setEnIframe] = useState<boolean | string>(false);
    const [msafe, setMsafe] = useState<MSafeServer>();
    const [request, setRequest] = useState<string>();

    const accept = useCallback(() => {
        const ano = no++;
        console.log('accpet:', ano);
        const cleaner = Connector.accepts(dappUrl, (connector) => {
            console.log('version:', connector.version);
            cleaner();
            const webWallet = (window as any).martian;
            const server = new MSafeServer(connector, {
                async connect(): Promise<Account> {
                    console.log('connect');
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
                    console.log("server:chainId");
                    return webWallet.getChainId().then((r: any) => r.chainId);
                },
                async signAndSubmit(
                    payload: Payload,
                    option?: Option
                ): Promise<Uint8Array> {
                    setRequest(WalletRPC.signAndSubmit);
                    const msafeAddress = await webWallet.account().then((acc:any) => acc.address);
                    const txn = await buildTransaction(payload, {sender: msafeAddress, ...option});
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
                    const msafeAddress = await webWallet.account().then((acc:any) => acc.address);
                    const txn = await buildTransaction(payload, {sender: msafeAddress, ...option});
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
            //console.log("server-version:", server.version)

            setMsafe(server);
            webWallet.onNetworkChange((network: any) => {
                server.changeNetwork(network);
            });
            webWallet.onAccountChange((account: any) => {
                console.log("onAccountChange:", account);
                webWallet
                    .account()
                    .then((account:any) => server.changeAccount(account));
            });
        });
        return ()=>{
            console.log("cleaner:", ano)
            cleaner();
        };
    }, []);
    // msafe accpet connection
    useEffect(() => {
        if(!msafe)
            return accept();
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
            <button onClick={() => setEnIframe("child")}>load iframe</button>
            <button onClick={() => setEnIframe("adaptor")}>
                load iframe adaptor
            </button>
            <button
                onClick={() =>
                    setEnIframe(
                        "http://localhost:3001/pontem-wallet-demo#/wallet-adapter"
                    )
                }
            >
                load another adaptor
            </button>
            {msafe && msafe.server.connector.connected && (
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
                    src={
                        String(enIframe).startsWith("http")
                            ? String(enIframe)
                            : dappUrl + `/#/${enIframe}`
                    }
                />
            )}
        </>
    );
}
