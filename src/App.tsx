import "./App.css";
import { IFrame } from "./iframe";
import { ChildIFrame } from "./childFrame";
import { ChildIFrameAdaptor } from "./childFrameAdaptor";
import { HashRouter, Route, Routes } from "react-router-dom";
import {
    WalletProvider,
    MartianWalletAdapter,
    PontemWalletAdapter,
    MSafeWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";
import { msafeURL } from "./dappURL";

const wallets = [
    new MartianWalletAdapter(),
    new PontemWalletAdapter(),
] as any[];
const withAdaptor = window.location.hash.includes("adaptor");
if(withAdaptor) {
    wallets.push(new MSafeWalletAdapter(msafeURL));
}

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
