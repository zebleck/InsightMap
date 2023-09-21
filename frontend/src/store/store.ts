// store.ts
import { configureStore } from "@reduxjs/toolkit";
import graphReducer from "./graphSlice";
import streamReducer from "./streamSlice";

const store = configureStore({
  reducer: {
    graph: graphReducer,
    stream: streamReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
