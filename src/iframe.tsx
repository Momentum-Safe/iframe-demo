import { useCallback, useEffect, useRef, useState } from "react";
import { Connector } from "./iframe/connector";
import { JsonRPCServer } from "./iframe/jsonrpc";

const dappUrl = "http://127.0.0.1:3001";
function IFrame() {
    const iframeRef = useRef(null);
    const [enIframe, setEnIframe] = useState(false);
    const [connector, setConnector] = useState<Connector>();
    const [server, setServer] = useState<JsonRPCServer>();
    const [request, setRequest] = useState<string>();
 
    const accept = useCallback(() => {
        const cleaner = Connector.accepts(dappUrl, (c) => {
            setConnector(c);
            setServer(new JsonRPCServer(c, {
                signTransaction(response, tx:string){
                    setRequest(tx);
                    tx.includes('invalid') ? response(`error: ${tx}`, true) : response(`signedTx:${tx}`);
                }
            }));
        });
        return cleaner;
    },[]);
    // msafe accpet connection
    useEffect(() => {
        const cleaner = accept();
        return () => {
            cleaner();
            connector && connector.close();
        };
    },[accept, connector]);
    return (
        <>
            <p>===================msafe frame: {window.location.href}</p>
            <button onClick={() => setEnIframe(true)}>load iframe</button>
            <button onClick={() => server?.notify('location', window.location.href)}>
                notify
            </button>
            <p>
                handshake:{connector && connector.connected
                    ? "connected"
                    : "disconnected"}
            </p>
            <p>request: {request}</p>
            {enIframe && (
                <iframe
                    ref={iframeRef}
                    title="Dapp"
                    width="100%"
                    height="400hv"
                    src={dappUrl+'/child'}
                />
            )}
        </>
    );
}

export default IFrame;
