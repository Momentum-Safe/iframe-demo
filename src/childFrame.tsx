import { useEffect, useState } from "react";
import { MsafeWallet } from "./iframe/MsafeWallet";

const msafeUrl = "http://localhost:3000";
function ChildIFrame() {
    const [wallet, setWallet] = useState<MsafeWallet>();
    const [response, setResponse] = useState<string>();
    const [error, setError] = useState<string>();
    const [notification, setNotification] = useState<string>();

    // child connect to msafe
    async function connect() {
        if (wallet) return;
        const w = await MsafeWallet.new();
        w.onChangeAccount((account)=>setNotification(JSON.stringify(account)));
        w.onChangeNetwork((network)=>{
            setNotification(network)
        });
        setWallet(w);
    }
    async function signTransaction(tx: string) {
        if (wallet) {
            try {
                const response = await wallet.signTransaction(Buffer.from(tx));
                setResponse(Buffer.from(response).toString());
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(Buffer.from(e.message).toString());
            }
        }
    }
    useEffect(() => {
        connect();
    }, [wallet]);
    return (
        <>
            <p>===================child frame: {window.location.href}</p>
            <button onClick={() => connect()}>handshake</button>
            <button onClick={() => signTransaction(window.location.href)}>
                signTransaction
            </button>
            <button onClick={() => signTransaction("tx-invalid")}>
                signTransaction Error
            </button>
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
