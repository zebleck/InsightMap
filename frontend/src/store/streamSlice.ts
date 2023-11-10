import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
});

const eventSources = {};

type StreamState = {
  currentStreams: Record<string, boolean>;
};

const initialState: StreamState = {
  currentStreams: {},
};

export const initiateAnswerStream = createAsyncThunk(
  "stream/initiate",
  async (payload: { question; onMessage; onError }, { dispatch }) => {
    const { onMessage, onError, question } = payload;

    const response = await axios.post(
      `${axiosInstance.defaults.baseURL}/generate_answer`,
      {
        question: question,
      },
    );

    const eventSource = new EventSource(
      `${axiosInstance.defaults.baseURL}/request_sse?session_id=${response.data.session_id}`,
    );

    const streamId = `${axiosInstance.defaults.baseURL}-${Date.now()}`;
    eventSources[streamId] = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === "__complete__") dispatch(removeStream(streamId));
      onMessage(event);
    };

    eventSource.onerror = (error) => {
      dispatch(removeStream(streamId));
      onError(error);
    };

    dispatch(addStream({ id: streamId }));

    return streamId;
  },
);

export const initiateRecommendationsStream = createAsyncThunk(
  "stream/initiate",
  async (
    payload: { nodeName; nodeContent; onMessage; onError },
    { dispatch },
  ) => {
    const { onMessage, onError, nodeName, nodeContent } = payload;

    const response = await axios.post(
      `${axiosInstance.defaults.baseURL}/generate_recommendations`,
      {
        node_name: nodeName,
        node_content: nodeContent,
      },
    );

    const eventSource = new EventSource(
      `${axiosInstance.defaults.baseURL}/request_sse?session_id=${response.data.session_id}`,
    );

    const streamId = `${axiosInstance.defaults.baseURL}-${Date.now()}`;
    eventSources[streamId] = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === "__complete__") dispatch(removeStream(streamId));
      onMessage(event);
    };

    eventSource.onerror = (error) => {
      dispatch(removeStream(streamId));
      onError(error);
    };

    dispatch(addStream({ id: streamId }));

    return streamId;
  },
);

const streamSlice = createSlice({
  name: "stream",
  initialState,
  reducers: {
    addStream: (state, action: PayloadAction<{ id: string }>) => {
      state.currentStreams[action.payload.id] = true;
    },
    removeStream: (state, action: PayloadAction<string>) => {
      if (state.currentStreams[action.payload]) {
        if (eventSources[action.payload]) {
          eventSources[action.payload].close();
          delete eventSources[action.payload];
        }
        delete state.currentStreams[action.payload];
      }
    },
  } /*,
  extraReducers: (builder) => {
    builder.addCase(initiateAnswerStream.fulfilled, (state, action) => {
      // You could do something upon successfully initiating a stream
    });
  }*/,
});

export const { addStream, removeStream } = streamSlice.actions;

export default streamSlice.reducer;
