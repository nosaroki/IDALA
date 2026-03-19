// src/context/LangContext.jsx
import { createContext, useContext } from 'react';

export const LangCtx = createContext();
export const useLang = () => useContext(LangCtx);