import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
});

const sanitizeNodename = (nodeName: string) => {
  return nodeName.replace(/[^a-zA-Z0-9_ -.]/g, "");
};

export const fetchGraph = createAsyncThunk("graph/fetchGraph", async () => {
  const response = await axiosInstance.get("/graph");
  return response.data;
});

export const fetchNode = createAsyncThunk(
  "graph/loadNode",
  async (nodeName: string) => {
    const response = await axiosInstance.get(`/graph/${nodeName}`);
    return { nodeName, ...response.data };
  },
);

export const saveNode = createAsyncThunk(
  "graph/saveNode",
  async (payload: { nodeName: string; content: string }) => {
    await axiosInstance.post(`/graph/saveNode/${payload.nodeName}`, {
      content: payload.content,
    });
    const response = await axiosInstance.get("/graph");
    return response.data;
  },
);

export const newNode = createAsyncThunk(
  "graph/newNode",
  async (nodeName: string | undefined, { dispatch, getState }) => {
    const state: any = getState();
    const { currentNode, markdownContent } = state.graph;

    if (nodeName) {
      await axiosInstance.post(`/save/${currentNode}`, {
        content: markdownContent,
      });

      await dispatch(fetchGraph());
      return nodeName;
    }
    return "";
  },
);

export const deleteNode = createAsyncThunk(
  "graph/deleteNode",
  async (nodeName: string, { dispatch }) => {
    await axiosInstance.delete(`/graph/${nodeName}`);
    await dispatch(fetchGraph());
  },
);

const graphSlice = createSlice({
  name: "graph",
  initialState: {
    currentNode: "",
    markdownContent: "",
    nodes: [],
    edges: [],
    status: "idle",
  },
  reducers: {
    setCurrentNode: (state, action: PayloadAction<string>) => {
      state.currentNode = sanitizeNodename(action.payload);
    },
    setMarkdownContent: (state, action: PayloadAction<string>) => {
      state.markdownContent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGraph.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.status = "fulfilled";
    });
    builder.addCase(fetchNode.fulfilled, (state, action) => {
      state.currentNode = action.payload.nodeName;
      state.markdownContent = action.payload.content;
      state.status = "fulfilled";
    });
    builder.addCase(saveNode.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.status = "fulfilled";
      toast.success("Saved!");
    });
    builder.addCase(newNode.fulfilled, (state, action) => {
      state.currentNode = action.payload;
      state.markdownContent = "";
      state.status = "fulfilled";
    });
    builder.addCase(deleteNode.fulfilled, (state) => {
      state.currentNode = "";
      state.markdownContent = "";
      state.status = "fulfilled";
      toast.success("Deleted!");
    });
  },
});

export const { setCurrentNode, setMarkdownContent } = graphSlice.actions;

export default graphSlice.reducer;
