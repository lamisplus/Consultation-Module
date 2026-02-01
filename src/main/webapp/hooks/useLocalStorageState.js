import { useState, useEffect, useRef } from 'react';

function useLocalStorageState(key, initialValue) {
    const isMounted = useRef(false);

    const [state, setState] = useState(() => {
        const init = typeof initialValue === 'function' ? initialValue() : initialValue;


        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                return init;
            }
            const item = window.localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : init;
        } catch (error) {
            return init;
        }
    });


    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);


    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (error) {

        }
    }, [key, state]);


    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === key && isMounted.current) {
                try {
                    const newValue = event.newValue !== null ? JSON.parse(event.newValue) : (typeof initialValue === 'function' ? initialValue() : initialValue);
                    setState(newValue);
                } catch (error) {

                }
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
            };
        }
    }, [key, initialValue]);

    return [state, setState];
}

export default useLocalStorageState;