import { BCS, TxnBuilderTypes } from "aptos";
import { useEffect, useState } from "react";
import { MsafeWallet } from "./iframe/MsafeWallet";
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
const msafeUrl = "http://localhost:3000";
function ChildIFrame() {
    const [wallet, setWallet] = useState<MsafeWallet>();
    const [response, setResponse] = useState<string>();
    const [error, setError] = useState<string>();
    const [notification, setNotification] = useState<string>();

    // child connect to msafe
    async function handshake() {
        if (wallet) return;
        const w = await MsafeWallet.new();
        w.onChangeAccount((account) =>
            setNotification(JSON.stringify(account))
        );
        w.onChangeNetwork((network) => {
            setNotification(network);
        });
        setWallet(w);
    }
    async function connect() {
        if (wallet) {
            try {
                const account = await wallet.connect();
                setResponse(`address:${account.address}\npublic key:${account.publicKey}`);
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(e.message);
            }
        }
    }
    async function disconnect() {
        await wallet?.disconnect();
    }
    async function network() {
        const network = await wallet?.network();
        setResponse(network);
        setError(undefined);
    }
    async function account() {
        const account = await wallet?.connect();
        setResponse(`address:${account!.address}\npublic key:${account!.publicKey}`);
        setError(undefined);
    }
    async function signAndSubmit() {
        if (wallet) {
            try {
                const response = await wallet.signAndSubmit(
                    BCS.bcsToBytes(fakeTxn)
                );
                setResponse(Buffer.from(response).toString("hex"));
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(e.message);
            }
        }
    }
    async function signMessage() {
        if (wallet) {
            try {
                const sig = await wallet.signMessage("hello");
                setResponse(Buffer.from(sig).toString("hex"));
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(e.message);
            }
        }
    }
    async function signTransaction() {
        if (wallet) {
            try {
                const response = await wallet.signTransaction(
                    BCS.bcsToBytes(fakeTxn)
                );
                setResponse(Buffer.from(response).toString("hex"));
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(e.message);
            }
        }
    }
    async function chainId() {
        if (wallet) {
            try {
                const response = await wallet.chainId();
                setResponse(response.toString());
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
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
            <button onClick={() => connect()}>connect</button>
            <button onClick={() => disconnect()}>disconnect</button>
            <button onClick={() => network()}>network</button>
            <button onClick={() => account()}>account</button>
            <button onClick={() => chainId()}>chainId</button>
            <button onClick={() => signAndSubmit()}>signAndSubmit</button>
            <button onClick={() => signTransaction()}>signTransaction</button>
            <button onClick={() => signMessage()}>signMessage</button>
            <p>
                handshake:
                {wallet && wallet.client.connector.connected
                    ? "connected"
                    : "disconnected"}
            </p>
            <p>response: {response}</p>
            <p>error: {error}</p>
            <p>notification: {notification}</p>
        </>
    );
}

export default ChildIFrame;
