import { useEffect, useState } from "react";
import { Connector } from "./iframe/connector";
import { JsonRPCClient } from "./iframe/jsonrpc";

const msafeUrl = "http://localhost:3000";
function ChildIFrame() {
    const [connector, setConnector] = useState<Connector>();
    const [client, setClient] = useState<JsonRPCClient>();
    const [response, setResponse] = useState<string>();
    const [error, setError] = useState<string>();
    const [notification, setNotification] = useState<string>();

    // child connect to msafe
    async function connect() {
        if (connector) return;
        const c = await Connector.connect(window.parent, msafeUrl);
        setConnector(c);
        setClient(
            new JsonRPCClient(c, {
                location(url: string) {
                    setNotification(url);
                },
            })
        );
    }
    async function signTransaction(tx: string) {
        if (client) {
            try {
                const response = await client.request("signTransaction", [tx]);
                setResponse(response);
                setError(undefined);
            } catch (e: any) {
                setResponse(undefined);
                setError(e.message);
            }
        }
    }
    useEffect(() => {
        connect();
    }, [connector]);
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
                {connector && connector.connected
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
