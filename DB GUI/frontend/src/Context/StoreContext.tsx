import {createContext, useContext, useEffect, useState} from "react";

type StoreContextType = {
    set<T>(shelf: string, key: string, value: T): void;
    get<T>(shelf: string, key?: string): T | undefined;
    remove(shelf: string, key: string): void;
    clear(shelf: string): void;
    ready: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function StoreProvider(props: any) {
    let [data, setData] = useState<{
        [key: string]: {
            [key: string]: any
        }
    }>({});
    let [ready, setReady] = useState(false);

    useEffect(() => {
        if(!ready) setReady(true);
    }, [data]);

    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key:string, value:any) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    function set<T>(shelf: string, key: string, value: T) {
        setData({
            ...data,
            [shelf]: {
                ...data[shelf],
                [key]: value
            }
        })

        localStorage.setItem("data", JSON.stringify(data, getCircularReplacer()));
    }

    function get<T>(shelf: string, key?: string): T | undefined {
        if (key) {
            return data[shelf][key] as T;
        }
        return data[shelf] as T;
    }

    function remove(shelf: string, key: string) {
        let newData = {...data};
        delete newData[shelf][key];
        setData(newData);
        localStorage.setItem("data", JSON.stringify(newData, getCircularReplacer()));
    }

    function clear(shelf: string) {
        let newData = {...data};
        delete newData[shelf];
        setData(newData);
    }

    function setup() {
        const data = localStorage.getItem("data");
        if (data) {
            setData(JSON.parse(data));
        } else {
            setReady(true);
        }
    }

    useEffect(() => {
        setup();
    }, []);

    return (
        <StoreContext.Provider value={{set, get, remove, clear, ready}}>
            {props.children}
        </StoreContext.Provider>
    )
}

function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}

export {StoreContext, StoreProvider, useStore};