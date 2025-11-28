from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys

# Import blockchain class
from blockchain import HealthBlockchain, WalletManager

app = FastAPI(title="RS MediTrust Blockchain API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize blockchain
blockchain = HealthBlockchain()

# Pydantic models
class UserRegistration(BaseModel):
    role: str
    nama: str
    umur: str
    no_identitas: str
    alamat: str
    no_telp: str
    specialization: Optional[str] = None
    patient_id: Optional[str] = None
    private_key_hex: Optional[str] = None

class HealthDataInput(BaseModel):
    patient_id: str
    data: Dict[str, Any]
    access_level: str
    user_address: str
    expiry_years: int = 5

class Login(BaseModel):
    private_key_hex: str

class AccessRequestCreate(BaseModel):
    patient_id: str
    requester_address: str
    data_type: str

class AccessRequestSign(BaseModel):
    request_id: str
    signer_address: str
    private_key_hex: str

@app.get("/")
def read_root():
    return {"message": "RS MediTrust Blockchain API", "status": "running"}

@app.post("/register")
def register_user(user: UserRegistration):
    try:
        profile_data = {
            'nama': user.nama,
            'umur': user.umur,
            'no_identitas': user.no_identitas,
            'alamat': user.alamat,
            'no_telp': user.no_telp,
            'specialization': user.specialization
        }

        wallet = blockchain.register_user(
            user.role,
            profile_data,
            private_key_hex=user.private_key_hex,
            patient_id=user.patient_id
        )

        if wallet:
            return {
                "success": True,
                "message": "User registered successfully",
                "data": wallet
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(credentials: Login):
    try:
        result = blockchain.login_with_private_key(credentials.private_key_hex)
        if "error" in result:
            raise HTTPException(status_code=401, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/health-data")
def add_health_data(data: HealthDataInput):
    try:
        success = blockchain.add_block(
            data.patient_id,
            data.data,
            data.access_level,
            data.user_address,
            data.expiry_years
        )
        if success:
            return {"success": True, "message": "Health data added to blockchain"}
        else:
            raise HTTPException(status_code=403, detail="Authorization failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient-data/{patient_id}")
def get_patient_data(patient_id: str, user_address: str, request_id: Optional[str] = None):
    try:
        data = blockchain.get_patient_data(patient_id, user_address, request_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/access-request")
def create_access_request(request: AccessRequestCreate):
    try:
        request_id = blockchain.create_access_request(
            request.patient_id,
            request.requester_address,
            request.data_type
        )
        return {"success": True, "request_id": request_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/access-request/sign")
def sign_access_request(signature: AccessRequestSign):
    try:
        success, message = blockchain.sign_access_request(
            signature.request_id,
            signature.signer_address,
            signature.private_key_hex
        )
        if success:
            return {"success": True, "message": message}
        else:
            raise HTTPException(status_code=400, detail=message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/verify-chain")
def verify_blockchain():
    try:
        is_valid = blockchain.verify_chain()
        return {
            "success": True,
            "valid": is_valid,
            "total_blocks": len(blockchain.chain)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert-patient/{patient_id}")
def convert_patient(patient_id: str):
    try:
        success = blockchain.convert_patient_to_ex_patient(patient_id)
        if success:
            return {"success": True, "message": f"Patient {patient_id} converted to ex-patient"}
        else:
            raise HTTPException(status_code=404, detail="Patient not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users")
def get_all_users():
    try:
        return {
            "success": True,
            "users": blockchain.users,
            "total": sum(len(users) for users in blockchain.users.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)