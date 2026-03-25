import React, { createContext, useState, useCallback } from 'react';

export const AttachedFilesFromAiContext = createContext({
    filesFromAi: [],
    setFilesFromAi: () => {},
    clearFilesFromAi: () => {},
});

export const AttachedFilesFromAiProvider = ({ children }) => {
    const [filesFromAi, setFilesFromAiState] = useState([]);

    const setFilesFromAi = useCallback((files) => {
        setFilesFromAiState(Array.isArray(files) ? files : []);
    }, []);

    const clearFilesFromAi = useCallback(() => {
        setFilesFromAiState([]);
    }, []);

    return (
        <AttachedFilesFromAiContext.Provider
            value={{ filesFromAi, setFilesFromAi, clearFilesFromAi }}
        >
            {children}
        </AttachedFilesFromAiContext.Provider>
    );
};
