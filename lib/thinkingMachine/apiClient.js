import axios from "axios";

export function toChatErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    "Sorry, something went wrong. Please try again."
  );
}

export async function analyze(payload) {
  const response = await axios.post("/api/analyze", payload);
  return response.data;
}

export async function chat(payload) {
  const response = await axios.post("/api/chat", payload);
  return response.data;
}

export async function chatToNodes(payload) {
  const response = await axios.post("/api/chat-to-nodes", payload);
  return response.data;
}

