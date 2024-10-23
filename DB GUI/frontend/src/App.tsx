import React from 'react';
import './App.css';
import {Header} from "./Components/Header";
import {Main} from "./Components/Main";
import {Footer} from "./Components/Footer";
import './customTheme.scss';
import {BoardProvider} from './Context/BoardContext';
import {StoreProvider} from "./Context/StoreContext";
import {SettingsProvider} from "./Context/SettingsContext";

function App() {

    return (
        <div className="App">
            <SettingsProvider>
                <StoreProvider>
                    <BoardProvider>
                        <Header/>
                        <Main/>
                        <Footer/>
                    </BoardProvider>
                </StoreProvider>
            </SettingsProvider>
        </div>
    );
}

export default App;
