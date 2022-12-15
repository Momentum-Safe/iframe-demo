import { useState, useCallback } from "react";

import { useWallet, MsafeWalletName } from "@manahippo/aptos-wallet-adapter";

import { Buffer } from "buffer";
import { fakePayload } from "./fakeTransaction";

const WalletName = MsafeWalletName;
console.log("-w:", WalletName);

export function ChildIFrameAdaptor() {
    const {
        account,
        connected,
        wallets,
        wallet,
        network,
        connect,
        disconnect,
        select,
        signAndSubmitTransaction,
        signTransaction,
        signMessage,
    } = useWallet();

    const [response, setResponse] = useState({});
    const [error, setError] = useState<string>();
    console.log(network);
    const handleConnect = useCallback(
        async (adapterName: string) => {
            if (adapterName) {
                try {
                    await connect(WalletName);
                } catch (e) {
                    console.log(e);
                }
            }
        },
        [connect]
    );

    const handleAdapterClick = useCallback(async () => {
        try {
            await handleConnect(WalletName);
            //select(WalletName);
        } catch (error) {
            console.log(error);
        }
    }, [select, handleConnect]);

    async function doSignAndSubmit() {
        setError(undefined);
        if (wallet) {
            try {
                const {payload, option} = await fakePayload(account!.address!.toString());
                const {hash} = await signAndSubmitTransaction(
                    payload, option
                );
                setResponse({
                    ...response,
                    txid: hash,
                });
            } catch (e: any) {
                setError(e);
            }
        }
    }
    async function doSignMessage() {
        setError(undefined);
        if (wallet) {
            try {
                const sig = await signMessage("hello");
                setResponse({
                    ...response,
                    messageSig: sig,
                });
            } catch (e: any) {
                setError(e);
            }
        }
    }
    async function doSignTransaction() {
        if (wallet) {
            try {
                const {payload, option} = await fakePayload(account!.address!.toString());
                const signedTxn = await signTransaction(
                    payload, option
                );
                console.log('=:', signedTxn);
                setResponse({
                    ...response,
                    signedTxn: Buffer.from(signedTxn).toString("hex"),
                });
                setError(undefined);
            } catch (e: any) {
                setError(e);
            }
        }
    }
    return (
        <>
            <p>===================child frame: {window.location.href}</p>
            <p>status: {connected ? "connected" : "disconnected"}</p>
            <p>address: {account ? account.address?.toString() : "-"}</p>
            <p>publicKey: {account ? account.publicKey?.toString() : "-"}</p>
            <p>
                network: {network ? network.name : "-"}{" "}
                {network ? network.chainId : "-"}
            </p>
            <button onClick={handleAdapterClick}> connect </button>
            <button onClick={disconnect}> disconnect </button>
            <button onClick={doSignAndSubmit}> doSignAndSubmit </button>
            <button onClick={doSignTransaction}> doSignTransaction </button>
            <button onClick={doSignMessage}> doSignMessage </button>
            <ul>
                {Object.entries(response).map(([key, value]) => (
                    <li key={key}>{`${key}: ${value}`}</li>
                ))}
            </ul>
            <p>error: {error}</p>
        </>
    );
}
