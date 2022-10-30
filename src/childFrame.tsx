import { BCS, TxnBuilderTypes } from "aptos";
import { useCallback, useEffect, useState } from "react";
import { MsafeWallet} from "msafe-iframe";

import { Buffer } from "buffer";

const fakePayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural("0x1::coin", "transfer", [], [])
);
const fakeTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex("0x123"),
    BigInt(0),
    fakePayload,
    BigInt(10000),
    BigInt(100),
    BigInt(1982241224),
    new TxnBuilderTypes.ChainId(31)
);
const msafeURL = window.origin.includes("localhost")
    ? window.origin.replace("localhost", "127.0.0.1")
    : window.origin.replace("127.0.0.1", "localhost");
export function ChildIFrame() {
    const [wallet, setWallet] = useState<MsafeWallet>();
    const [response, setResponse] = useState({});
    const [error, setError] = useState<string>();
    const [notification, setNotification] = useState<string>();

    // child connect to msafe
    const handshake = useCallback(
        async function () {
            if (wallet) return;
            const w = await MsafeWallet.new(msafeURL);
            w.onChangeAccount((account) =>
                setNotification(`onChangeAccount:${account}`)
            );
            w.onChangeNetwork((network) =>
                setNotification(`onChangeNetwork:${network}`)
            );
            setWallet(w);
        },
        [wallet]
    );
    async function connect() {
        setError(undefined);
        if (wallet) {
            try {
                const account = await wallet.connect();
                setResponse({
                    ...response,
                    address: account.address,
                    publicKey: account.publicKey,
                });
            } catch (e: any) {
                setError(e.message);
            }
        }
    }
    async function disconnect() {
        await wallet?.disconnect();
        setResponse({});
        setError(undefined);
        setNotification(undefined);
    }
    async function isConnected() {
        setError(undefined);
        const isConnected = await wallet?.isConnected();
        setResponse({...response, isConnected});
    }
    async function network() {
        setError(undefined);
        const network = await wallet?.network();
        setResponse({ ...response, network });
    }
    async function account() {
        setError(undefined);
        try {
            const account = await wallet!.account();
            setResponse({
                ...response,
                address: account.address,
                publicKey: account.publicKey,
            });
        } catch (e: any) {
            setError(e.message);
        }
    }
    async function signAndSubmit() {
        setError(undefined);
        if (wallet) {
            try {
                const txid = await wallet.signAndSubmit(
                    BCS.bcsToBytes(fakeTxn)
                );
                setResponse({
                    ...response,
                    txid: Buffer.from(txid).toString("hex"),
                });
            } catch (e: any) {
                setError(e.message);
            }
        }
    }
    async function signMessage() {
        setError(undefined);
        if (wallet) {
            try {
                const sig = await wallet.signMessage("hello");
                setResponse({
                    ...response,
                    messageSig: Buffer.from(sig).toString("hex"),
                });
            } catch (e: any) {
                setError(e.message);
            }
        }
    }
    async function signTransaction() {
        if (wallet) {
            try {
                const signedTxn = await wallet.signTransaction(
                    BCS.bcsToBytes(fakeTxn)
                );
                setResponse({
                    ...response,
                    signedTxn: Buffer.from(signedTxn).toString("hex"),
                });
                setError(undefined);
            } catch (e: any) {
                setError(e.message);
            }
        }
    }
    async function chainId() {
        if (wallet) {
            setError(undefined);
            try {
                const chainId = await wallet.chainId();
                setResponse({ ...response, chainId: chainId.toString() });
            } catch (e: any) {
                setError(e.message);
            }
        }
    }
    useEffect(() => {
        handshake();
    }, [wallet, handshake]);
    return (
        <>
            <p>===================child frame: {window.location.href}</p>
            <p>
                handshake:
                {wallet && wallet.client.connector.connected
                    ? "connected"
                    : "disconnected"}
            </p>
            {wallet && wallet.client.connector.connected && (
                <>
                    <button onClick={() => connect()}>connect</button>
                    <button onClick={() => disconnect()}>disconnect</button>
                    <button onClick={() => isConnected()}>isConnected</button>
                    <button onClick={() => network()}>network</button>
                    <button onClick={() => account()}>account</button>
                    <button onClick={() => chainId()}>chainId</button>
                    <button onClick={() => signAndSubmit()}>
                        signAndSubmit
                    </button>
                    <button onClick={() => signTransaction()}>
                        signTransaction
                    </button>
                    <button onClick={() => signMessage()}>signMessage</button>
                    <ul>
                        {Object.entries(response).map(([key, value]) => (
                            <li key={key}>{`${key}: ${value}`}</li>
                        ))}
                    </ul>
                    <p>error: {error}</p>
                    <p>notification: {notification}</p>
                </>
            )}
        </>
    );
}

export default ChildIFrame;
