import { useCallback, useEffect, useRef, useState } from "react";
import { Connector } from "./iframe/connector";
import { MsafeServer, Option } from "./iframe/MsafeServer";
import { Payload } from "./iframe/payload";

const dappUrl = "http://127.0.0.1:3001";
function IFrame() {
    const iframeRef = useRef(null);
    const [enIframe, setEnIframe] = useState(false);
    const [msafe, setMsafe] = useState<MsafeServer>();
    const [request, setRequest] = useState<string>();
 
    const accept = useCallback(() => {
        const cleaner = Connector.accepts(dappUrl, (connector) => {
            setMsafe(new MsafeServer(connector, {
                async signTransaction(payload:Payload, option:Option):Promise<Uint8Array> {
                    if(payload instanceof Uint8Array) {
                        if(Buffer.from(payload).toString().includes('invalid')) throw Error(`error-tx`);
                    }
                    setRequest('signTransaction');
                    return Buffer.from("signed");
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
            msafe && msafe.server.connector.close();
        };
    },[accept, msafe]);
    return (
        <>
            <p>===================msafe frame: {window.location.href}</p>
            <button onClick={() => setEnIframe(true)}>load iframe</button>
            <button onClick={() => msafe && msafe.changeNetwork(window.location.href)}>
                notify
            </button>
            <p>
                handshake:{msafe && msafe.server.connector.connected
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
