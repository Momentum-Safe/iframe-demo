import { BCS, TxnBuilderTypes } from "aptos";
import { useState, useCallback } from "react";

import { useWallet, MsafeWalletName } from "@manahippo/aptos-wallet-adapter";

import { Buffer } from "buffer";

const WalletName = MsafeWalletName;
console.log("-w:", WalletName);

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
            select(WalletName);
        } catch (error) {
            console.log(error);
        }
    }, [select, handleConnect]);

    async function doSignAndSubmit() {
        setError(undefined);
        if (wallet) {
            try {
                const {hash} = await signAndSubmitTransaction(
                    BCS.bcsToBytes(fakeTxn) as any
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
                const signedTxn = await signTransaction(
                    BCS.bcsToBytes(fakeTxn) as any
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
