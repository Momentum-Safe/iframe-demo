import "./App.css";
import IFrame from "./iframe";
import ChildIFrame from "./childFrame";

function App() {
    return (
        <div className="App">
            {window.location.pathname === "/child" ? (
                <ChildIFrame />
            ) : (
                <IFrame />
            )}
        </div>
    );
}

export default App;
