import { AptosClient, BCS, TxnBuilderTypes } from "aptos";
import { useCallback, useEffect, useState } from "react";
import { MsafeWallet } from "msafe-iframe";

import { Buffer } from "buffer";

const aptosClient = new AptosClient(
    "https://fullnode.testnet.aptoslabs.com/v1"
);

const COIN_MODULE = "0x1::coin";
const TRANSFER_METHOD = "transfer";
const APTOS_TOKEN = "0x1::aptos_coin::AptosCoin";

let from = "0x8284169a7564153e0d767176164db1466f5b2ba03abfd587702d44c7dda0a690";
const to = "0xe3785fa2ccd744e7799b271b624bb2557fbf5d466b72a1b11f3d3ebc0037434f";
const amount = 12345n;

const fakePayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
        COIN_MODULE,
        TRANSFER_METHOD,
        [
            new TxnBuilderTypes.TypeTagStruct(
                TxnBuilderTypes.StructTag.fromString(APTOS_TOKEN)
            ),
        ],
        [
            BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(to)),
            BCS.bcsSerializeUint64(amount),
        ]
    )
);

const fakePayload1 = {
    function: `${COIN_MODULE}::${TRANSFER_METHOD}`,
    type_arguments: [APTOS_TOKEN],
    arguments: [to, amount],
};
const fakeOption = {
    sender: from,
    gas_unit_price: 100n,
};

const fakeTxn = async () => {
    const { sequence_number } = await aptosClient.getAccount(from);
    const chainId = await aptosClient.getChainId();
    return new TxnBuilderTypes.RawTransaction(
        TxnBuilderTypes.AccountAddress.fromHex(fakeOption.sender),
        BigInt(sequence_number),
        fakePayload,
        10000n,
        fakeOption.gas_unit_price,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new TxnBuilderTypes.ChainId(chainId)
    );
};

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
                from = account.address;
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
                    ? await wallet.signAndSubmit(BCS.bcsToBytes(await fakeTxn()))
                    : await wallet.signAndSubmit(
                          fakePayload1,
                          fakeOption
                      );
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
    async function signTransaction(bcs = true) {
        if (wallet) {
            try {
                const signedTxn = bcs
                    ? await wallet.signTransaction(BCS.bcsToBytes(await fakeTxn()))
                    : await wallet.signTransaction(
                          fakePayload1,
                          fakeOption
                      );
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
                    <button onClick={() => signTransaction()}>
                        signTransaction-BCS
                    </button>
                    <button onClick={() => signTransaction(false)}>
                        signTransaction-PAYLOAD
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
