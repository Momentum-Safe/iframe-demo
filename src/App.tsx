import "./App.css";
import { IFrame } from "./iframe";
import { ChildIFrame } from "./childFrame";
import { ChildIFrameAdaptor } from "./childFrameAdaptor";
import { HashRouter, Route, Routes } from "react-router-dom";
import {
    WalletProvider,
    MartianWalletAdapter,
    PontemWalletAdapter,
    MsafeWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";

const msafeURL = window.origin.includes("localhost")
    ? window.origin.replace("localhost", "127.0.0.1")
    : window.origin.replace("127.0.0.1", "localhost");
const wallets = [
    new MartianWalletAdapter(),
    new PontemWalletAdapter(),
    new MsafeWalletAdapter(msafeURL),
];
const localStorageKey = 'hippoWallet';

function App() {
    return (
        <HashRouter>
            <div className="app">
                <Routes>
                    <Route index element={<IFrame />} />
                    <Route path="/child" element={<ChildIFrame />} />
                    <Route
                        path="/adaptor"
                        element={
                            <WalletProvider
                                wallets={wallets}
                                localStorageKey={localStorageKey}
                            >
                                <ChildIFrameAdaptor/>
                            </WalletProvider>
                        }
                    />
                </Routes>
            </div>
        </HashRouter>
    );
}

export default App;
