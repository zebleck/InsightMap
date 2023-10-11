import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
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

// gets node content
export const fetchNode = createAsyncThunk(
  "graph/fetchNode",
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

/*
------------------
TAGS
------------------
*/

export const tagNode = createAsyncThunk(
  "graph/tagNode",
  async (payload: { nodeName: string; tags: string[] }) => {
    await axiosInstance.post(`/graph/tagNode`, payload);
    const response = await axiosInstance.get("/graph");
    return response.data;
  },
);

export const removeTagFromNode = createAsyncThunk(
  "graph/removeTag",
  async (payload: { nodeName: string; tag: string }) => {
    await axiosInstance.post(`/graph/removeTag`, payload);
    const response = await axiosInstance.get("/graph");
    return response.data;
  },
);

/*
------------------
SELECTORS
------------------
*/

const findNodeIdByLabel = (label: string, nodes: any[]) => {
  const node = nodes.find((n) => n.label === label);
  return node ? node.id : null;
};

export const selectTagsByNode = (nodeName: string) =>
  createSelector(
    (state: any) => state.graph.nodes,
    (nodes) => {
      const nodeId = findNodeIdByLabel(nodeName, nodes);
      if (nodeId) {
        const node = nodes.find((n) => n.id === nodeId);
        return node ? node.tags : [];
      }
      return [];
    },
  );

export const selectAllTags = createSelector(
  (state: any) => state.graph.nodes,
  (nodes) => {
    const tags = nodes
      .map((n) => n.tags) // Extract tags from each node
      .filter(Boolean) // Remove null or undefined values
      .flat(); // Flatten the array

    return Array.from(new Set(tags)); // Remove duplicates
  },
);

export const selectConnectedNodeTags = createSelector(
  (state: any) => state.graph.connectedNodes,
  (connectedNodes) => {
    const tags = connectedNodes
      .map((n) => n.tags) // Extract tags from each node
      .filter(Boolean) // Remove null or undefined values
      .flat(); // Flatten the array

    return Array.from(new Set(tags)); // Remove duplicates
  },
);

export const nodeWithLabelExists = (label: string) =>
  createSelector(
    (state: any) => state.graph.nodes,
    (nodes) => nodes.some((n) => n.label === label),
  );

/*const findNodeLabelById = (id: string, nodes: any[]) => {
  const node = nodes.find((n) => n.id === id);
  return node ? node.label : null;
};*/

// used to update the connected nodes state when the current node changes
const updateConnectedNodes = (state) => {
  const currentNodeId = findNodeIdByLabel(state.currentNode, state.nodes);
  if (currentNodeId !== null) {
    const connectedNodes = state.edges
      .filter(
        (edge) => edge.from === currentNodeId || edge.to === currentNodeId,
      )
      .map((edge) => {
        const targetNodeId = edge.from === currentNodeId ? edge.to : edge.from;
        return state.nodes.find((node) => node.id === targetNodeId);
      })
      // Remove duplicates by id
      .filter(
        (node, index, self) =>
          index === self.findIndex((t) => t.id === node.id),
      );

    state.connectedNodes = connectedNodes;
  } else {
    state.connectedNodes = [];
  }
};

const graphSlice = createSlice({
  name: "graph",
  initialState: {
    currentNode: "",
    connectedNodes: [],
    markdownContent: "",
    nodes: [],
    edges: [],
    status: "idle",
  },
  reducers: {
    setCurrentNode: (state, action: PayloadAction<string>) => {
      state.currentNode = sanitizeNodename(action.payload);
      updateConnectedNodes(state);
    },
    setMarkdownContent: (state, action: PayloadAction<string>) => {
      state.markdownContent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGraph.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      updateConnectedNodes(state);
      state.status = "fulfilled";
    });
    builder.addCase(fetchNode.fulfilled, (state, action) => {
      state.currentNode = action.payload.nodeName;
      state.markdownContent = action.payload.content;
      updateConnectedNodes(state);
      state.status = "fulfilled";
    });
    builder.addCase(saveNode.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      updateConnectedNodes(state);
      state.status = "fulfilled";
      toast.success("Saved!");
    });
    builder.addCase(newNode.fulfilled, (state, action) => {
      state.currentNode = action.payload;
      state.markdownContent = "";
      updateConnectedNodes(state);
      state.status = "fulfilled";
    });
    builder.addCase(deleteNode.fulfilled, (state) => {
      state.currentNode = "";
      state.markdownContent = "";
      updateConnectedNodes(state);
      state.status = "fulfilled";
      toast.success("Deleted!");
    });
    builder.addCase(tagNode.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      updateConnectedNodes(state);
      state.status = "fulfilled";
      toast.success("Tag added!");
    });
    builder.addCase(removeTagFromNode.fulfilled, (state, action) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      updateConnectedNodes(state);
      state.status = "fulfilled";
      toast.success("Tag removed!");
    });
  },
});

export const { setCurrentNode, setMarkdownContent } = graphSlice.actions;

export default graphSlice.reducer;
