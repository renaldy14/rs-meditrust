// frontend/lib/api.js
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function registerUser(payload) {
  const res = await api.post("/register", payload);
  return res.data;
}

export async function loginWithPrivateKey(private_key_hex) {
  const res = await api.post("/login", { private_key_hex });
  return res.data;
}

export async function addHealthData(payload) {
  const res = await api.post("/health-data", payload);
  return res.data;
}

export async function getPatientData(patient_id, user_address, request_id) {
  const res = await api.get(`/patient-data/${patient_id}`, {
    params: {
      user_address,
      request_id: request_id || undefined,
    },
  });
  return res.data;
}

export async function createAccessRequest(payload) {
  const res = await api.post("/access-request", payload);
  return res.data;
}

export async function signAccessRequest(payload) {
  const res = await api.post("/access-request/sign", payload);
  return res.data;
}

export async function convertPatient(patient_id) {
  const res = await api.post(`/convert-patient/${patient_id}`);
  return res.data;
}

export async function getAllUsers() {
  const res = await api.get("/users");
  return res.data;
}

export async function verifyChain() {
  const res = await api.get("/verify-chain");
  return res.data;
}
