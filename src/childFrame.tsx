import { BCS } from "aptos";
import { useCallback, useEffect, useState } from "react";
import { MsafeWallet } from "msafe-wallet";
//const { MsafeWallet } = require("msafe-wallet");

import { Buffer } from "buffer";
import { fakePayload, fakeTxn } from "./fakeTransaction";

let sender = '';

const msafeURL = 'https://partner.m-safe.io';
export function ChildIFrame() {
    const [wallet, setWallet] = useState<MsafeWallet>();
    const [response, setResponse] = useState({});
    const [error, setError] = useState<string>();
    const [notification, setNotification] = useState<string>();
    const selectMsafe = true;
    if(selectMsafe && !MsafeWallet.inMsafeWallet()){
        window.location.replace(MsafeWallet.getAppUrl(msafeURL));
    }

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
                sender = account.address;
                setResponse({
                    ...response,
                    address: account.address,
                    publicKey: account.publicKey,
                });
            } catch (e: any) {
                console.log("err:", e);
                setError(e);
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
        setResponse({ ...response, isConnected });
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
            setError(e);
        }
    }
    async function signAndSubmit(bcs = true) {
        setError(undefined);
        if (wallet) {
            try {
                const txid = bcs
                    ? await wallet.signAndSubmit(BCS.bcsToBytes(await fakeTxn(sender)))
                    : await fakePayload(sender).then(({payload, option})=>wallet.signAndSubmit(payload, option));
                setResponse({
                    ...response,
                    txid: Buffer.from(txid).toString("hex"),
                });
            } catch (e: any) {
                setError(e);
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
                setError(e);
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
                setError(e);
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
                        signAndSubmit-BCS
                    </button>
                    <button onClick={() => signAndSubmit(false)}>
                        signAndSubmit-PAYLOAD
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
