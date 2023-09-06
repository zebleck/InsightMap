// fileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
});

const sanitizeFilename = (fileName: string) => {
  return fileName.replace(/[^a-zA-Z0-9_ -.]/g, "");
};

export const fetchFiles = createAsyncThunk("files/fetchFiles", async () => {
  const response = await axiosInstance.get("/files");
  return response.data;
});

export const fetchFile = createAsyncThunk(
  "files/loadFile",
  async (fileName: string) => {
    const response = await axiosInstance.get(`/files/${fileName}`);
    return { fileName, ...response.data };
  },
);

export const saveFile = createAsyncThunk(
  "files/saveFile",
  async (payload: { fileName: string; content: string }) => {
    await axiosInstance.post(`/save/${payload.fileName}`, {
      content: payload.content,
    });
    const response = await axiosInstance.get("/files");
    return response.data;
  },
);

export const newFile = createAsyncThunk(
  "files/newFile",
  async (fileName: string | undefined, { dispatch, getState }) => {
    const state: any = getState();
    const { currentFile, markdownContent } = state.files;

    if (fileName) {
      await axiosInstance.post(`/save/${currentFile}`, {
        content: markdownContent,
      });

      await dispatch(fetchFiles());
      return fileName + ".md";
    }
    return "";
  },
);

export const deleteFile = createAsyncThunk(
  "files/deleteFile",
  async (fileName: string, { dispatch }) => {
    await axiosInstance.delete(`/files/${fileName}`);
    await dispatch(fetchFiles());
  },
);

const fileSlice = createSlice({
  name: "files",
  initialState: {
    currentFile: "",
    markdownContent: "",
    savedFiles: [],
    status: "idle",
  },
  reducers: {
    setCurrentFile: (state, action: PayloadAction<string>) => {
      state.currentFile = sanitizeFilename(action.payload);
    },
    setMarkdownContent: (state, action: PayloadAction<string>) => {
      state.markdownContent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFiles.fulfilled, (state, action) => {
      state.savedFiles = action.payload;
      state.status = "fulfilled";
    });
    builder.addCase(fetchFile.fulfilled, (state, action) => {
      state.currentFile = action.payload.fileName;
      state.markdownContent = action.payload.content;
      state.status = "fulfilled";
    });
    builder.addCase(saveFile.fulfilled, (state, action) => {
      state.savedFiles = action.payload;
      state.status = "fulfilled";
      toast.success("Saved!");
    });
    builder.addCase(newFile.fulfilled, (state, action) => {
      state.currentFile = action.payload;
      state.markdownContent = "";
      state.status = "fulfilled";
    });
    builder.addCase(deleteFile.fulfilled, (state) => {
      state.currentFile = "";
      state.markdownContent = "";
      state.status = "fulfilled";
      toast.success("Deleted!");
    });
  },
});

export const { setCurrentFile, setMarkdownContent } = fileSlice.actions;

export default fileSlice.reducer;
