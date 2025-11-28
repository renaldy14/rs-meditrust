import hashlib
import datetime
from dateutil.relativedelta import relativedelta
from ecdsa import SigningKey, VerifyingKey, SECP256k1, BadSignatureError
import base58
import json
from Crypto.Hash import RIPEMD160

class WalletManager:
    """Manages wallet generation and verification"""

    @staticmethod
    def generate_wallet():
        """Generate new wallet with private key, public key, and address"""
        try:
            sk = SigningKey.generate(curve=SECP256k1)
            private_key_bytes = sk.to_string()
            private_key_hex = private_key_bytes.hex()

            vk = sk.get_verifying_key()
            public_key_bytes = vk.to_string()
            public_key_uncompressed = b'\x04' + public_key_bytes
            public_key_hex = public_key_uncompressed.hex()

            # Generate address from public key
            sha256_pk = hashlib.sha256(public_key_uncompressed).digest()
            ripemd160 = RIPEMD160.new()
            ripemd160.update(sha256_pk)
            hashed_pk = ripemd160.digest()

            versioned_payload = b'\x00' + hashed_pk
            checksum = hashlib.sha256(hashlib.sha256(versioned_payload).digest()).digest()[:4]
            address_bytes = versioned_payload + checksum
            address = base58.b58encode(address_bytes).decode()

            return {
                "private_key_hex": private_key_hex,
                "public_key_hex": public_key_hex,
                "address": address,
                "signing_key": sk
            }
        except Exception as e:
            print(f"Error generating wallet: {e}")
            return None

    @staticmethod
    def get_public_key_from_private(private_key_hex):
        """Recover public key and address from private key"""
        try:
            if not private_key_hex or len(private_key_hex) != 64:
                raise ValueError("Private key must be 64 hexadecimal characters")

            private_key_bytes = bytes.fromhex(private_key_hex)
            sk = SigningKey.from_string(private_key_bytes, curve=SECP256k1)

            vk = sk.get_verifying_key()
            public_key_bytes = vk.to_string()
            public_key_uncompressed = b'\x04' + public_key_bytes
            public_key_hex = public_key_uncompressed.hex()

            sha256_pk = hashlib.sha256(public_key_uncompressed).digest()
            ripemd160 = RIPEMD160.new()
            ripemd160.update(sha256_pk)
            hashed_pk = ripemd160.digest()

            versioned_payload = b'\x00' + hashed_pk
            checksum = hashlib.sha256(hashlib.sha256(versioned_payload).digest()).digest()[:4]
            address_bytes = versioned_payload + checksum
            address = base58.b58encode(address_bytes).decode()

            return {
                "public_key_hex": public_key_hex,
                "address": address,
                "signing_key": sk
            }
        except ValueError as ve:
            print(f"Invalid private key format: {ve}")
            return None
        except Exception as e:
            print(f"Error recovering keys: {e}")
            return None

    @staticmethod
    def sign_message(private_key_hex, message):
        """Sign a message with private key"""
        try:
            private_key_bytes = bytes.fromhex(private_key_hex)
            sk = SigningKey.from_string(private_key_bytes, curve=SECP256k1)
            signature = sk.sign(message.encode())
            return signature.hex()
        except Exception as e:
            print(f"Error signing message: {e}")
            return None

    @staticmethod
    def verify_signature(public_key_hex, message, signature_hex):
        """Verify a signature"""
        try:
            public_key_bytes = bytes.fromhex(public_key_hex[2:])  # Remove '04' prefix
            vk = VerifyingKey.from_string(public_key_bytes, curve=SECP256k1)
            signature = bytes.fromhex(signature_hex)
            vk.verify(signature, message.encode())
            return True
        except BadSignatureError:
            return False
        except Exception as e:
            print(f"Error verifying signature: {e}")
            return False


class UserProfile:
    """Store user credential information"""
    def __init__(self, nama, umur, no_identitas, alamat, no_telp, specialization=None):
        self.nama = nama
        self.umur = umur
        self.no_identitas = no_identitas  # KTP/SIP/STR number
        self.alamat = alamat
        self.no_telp = no_telp
        self.specialization = specialization  # For doctors
        self.created_at = datetime.datetime.now()

    def to_dict(self):
        return {
            "nama": self.nama,
            "umur": self.umur,
            "no_identitas": self.no_identitas,
            "alamat": self.alamat,
            "no_telp": self.no_telp,
            "specialization": self.specialization,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }


class AccessRequest:
    """Manage multi-signature access requests"""
    def __init__(self, request_id, patient_id, requester_address, data_type):
        self.request_id = request_id
        self.patient_id = patient_id
        self.requester_address = requester_address
        self.data_type = data_type  # 'private' or 'patient'
        self.signatures = {}  # {address: signature}
        self.created_at = datetime.datetime.now()
        self.status = "pending"  # pending, approved, rejected
        self.required_signatures = 2  # Need doctor + komite_medis

    def add_signature(self, address, signature):
        """Add a signature to the request"""
        self.signatures[address] = signature
        if len(self.signatures) >= self.required_signatures:
            self.status = "approved"

    def is_approved(self):
        return self.status == "approved"


class HealthBlock:
    def __init__(self, patient_id, data, access_level, previous_hash, creator_address, expiry_years=5):
        self.patient_id = patient_id
        self.data = data
        self.access_level = access_level
        self.previous_hash = previous_hash
        self.creator_address = creator_address
        self.timestamp = datetime.datetime.now()
        self.expiry_date = self.timestamp + relativedelta(years=expiry_years)
        self.is_expired = False
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = (str(self.patient_id) + str(self.data) +
                       str(self.timestamp) + str(self.previous_hash) +
                       str(self.creator_address) + str(self.expiry_date))
        return hashlib.sha256(block_string.encode()).hexdigest()

    def check_expiry(self):
        """Check if block has expired (5 years)"""
        if datetime.datetime.now() >= self.expiry_date:
            self.is_expired = True
        return self.is_expired


class HealthBlockchain:
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.users = {}  # {role: {address: wallet_info}}
        self.user_roles = {}  # {address: role}
        self.user_profiles = {}  # {address: UserProfile}
        self.patient_addresses = {}  # {patient_id: [addresses]}
        self.patient_status = {}  # {patient_id: 'active' or 'ex-patient'}
        self.access_requests = {}  # {request_id: AccessRequest}
        self.authorized_roles = {
            'private': ['komite_medis', 'direktur'],
            'public': ['suster', 'doc', 'komite_medis', 'direktur'],
            'patient': ['patient', 'ex-patient', 'family']
        }

    def create_genesis_block(self):
        return HealthBlock(0, "Genesis Block", "public", "0", "SYSTEM", expiry_years=100)

    def get_latest_block(self):
        return self.chain[-1]

    def register_user(self, role, profile_data, private_key_hex=None, patient_id=None):
        """
        Register user with credential information

        Args:
            role: User role
            profile_data: dict with nama, umur, no_identitas, alamat, no_telp, specialization
            private_key_hex: Optional existing private key
            patient_id: Required for patient/ex-patient/family
        """
        try:
            # Create user profile
            profile = UserProfile(
                nama=profile_data['nama'],
                umur=profile_data['umur'],
                no_identitas=profile_data['no_identitas'],
                alamat=profile_data['alamat'],
                no_telp=profile_data['no_telp'],
                specialization=profile_data.get('specialization')
            )

            # Generate or import wallet
            if private_key_hex:
                wallet_info = WalletManager.get_public_key_from_private(private_key_hex)
                if not wallet_info:
                    return None
                wallet_info['private_key_hex'] = private_key_hex
            else:
                wallet_info = WalletManager.generate_wallet()
                if not wallet_info:
                    return None

            address = wallet_info['address']

            # Store user information
            if role not in self.users:
                self.users[role] = {}

            self.users[role][address] = wallet_info
            self.user_roles[address] = role
            self.user_profiles[address] = profile

            # Handle patient/ex-patient/family
            if role in ['patient', 'ex-patient', 'family'] and patient_id:
                if patient_id not in self.patient_addresses:
                    self.patient_addresses[patient_id] = []
                self.patient_addresses[patient_id].append(address)

                # Set patient status
                if role == 'patient':
                    self.patient_status[patient_id] = 'active'
                elif role == 'ex-patient':
                    self.patient_status[patient_id] = 'ex-patient'

            wallet_info['profile'] = profile.to_dict()
            return wallet_info

        except Exception as e:
            print(f"Error registering user: {e}")
            return None

    def convert_patient_to_ex_patient(self, patient_id):
        """Convert active patient to ex-patient"""
        if patient_id in self.patient_status:
            self.patient_status[patient_id] = 'ex-patient'

            # Update role for all addresses linked to this patient
            for address in self.patient_addresses.get(patient_id, []):
                if self.user_roles.get(address) == 'patient':
                    # Remove from patient role
                    if address in self.users.get('patient', {}):
                        wallet_info = self.users['patient'].pop(address)
                        # Add to ex-patient role
                        if 'ex-patient' not in self.users:
                            self.users['ex-patient'] = {}
                        self.users['ex-patient'][address] = wallet_info
                        self.user_roles[address] = 'ex-patient'

            return True
        return False

    def create_access_request(self, patient_id, requester_address, data_type):
        """Create a multi-signature access request"""
        request_id = hashlib.sha256(
            f"{patient_id}{requester_address}{datetime.datetime.now()}".encode()
        ).hexdigest()[:16]

        request = AccessRequest(request_id, patient_id, requester_address, data_type)
        self.access_requests[request_id] = request
        return request_id

    def sign_access_request(self, request_id, signer_address, private_key_hex):
        """Sign an access request (for doctor/komite_medis)"""
        if request_id not in self.access_requests:
            return False, "Request not found"

        request = self.access_requests[request_id]
        role = self.user_roles.get(signer_address)

        # Only doctor and komite_medis can sign
        if role not in ['doc', 'komite_medis']:
            return False, "Only doctor or medical committee can sign"

        # Create signature
        message = f"{request_id}{request.patient_id}{request.requester_address}"
        signature = WalletManager.sign_message(private_key_hex, message)

        if signature:
            request.add_signature(signer_address, signature)
            return True, "Signature added successfully"

        return False, "Failed to create signature"

    def check_authorization(self, address, access_level, patient_id=None):
        """Check authorization with expiry consideration"""
        if address not in self.user_roles:
            return False

        role = self.user_roles[address]

        if access_level == 'private':
            return role in self.authorized_roles['private']

        if access_level == 'patient':
            if patient_id and address in self.patient_addresses.get(patient_id, []):
                return True
            return role in self.authorized_roles['private'] + self.authorized_roles['public']

        return role in self.authorized_roles['private'] + self.authorized_roles['public']

    def add_block(self, patient_id, data, access_level, user_address, expiry_years=5):
        """Add a new block with expiry date"""
        try:
            if self.check_authorization(user_address, access_level, patient_id):
                new_block = HealthBlock(
                    patient_id,
                    data,
                    access_level,
                    self.get_latest_block().hash,
                    user_address,
                    expiry_years
                )
                self.chain.append(new_block)
                return True
            else:
                print(f"Authorization failed for address {user_address}")
                return False
        except Exception as e:
            print(f"Error adding block: {e}")
            return False

    def clean_expired_blocks(self):
        """Mark expired blocks (data older than 5 years)"""
        expired_count = 0
        for block in self.chain[1:]:
            if block.check_expiry():
                expired_count += 1
        return expired_count

    def get_patient_data(self, patient_id, user_address, request_id=None):
        """
        Get patient data with multi-signature support

        Args:
            patient_id: Patient ID
            user_address: Requester's address
            request_id: Optional access request ID for multi-sig approval
        """
        patient_data = {
            'public': [],
            'private': [],
            'patient': [],
            'expired': []
        }

        try:
            role = self.user_roles.get(user_address)
            is_patient_or_family = user_address in self.patient_addresses.get(patient_id, [])

            # Check if multisig approval is needed and valid
            needs_multisig = is_patient_or_family and role in ['patient', 'ex-patient', 'family']
            multisig_approved = False

            if needs_multisig and request_id:
                request = self.access_requests.get(request_id)
                if request and request.is_approved():
                    multisig_approved = True

            for block in self.chain[1:]:
                if block.patient_id == patient_id:
                    # Check expiry
                    if block.check_expiry():
                        patient_data['expired'].append({
                            'data': '[EXPIRED - Data removed after 5 years]',
                            'expired_date': block.expiry_date.strftime("%Y-%m-%d"),
                            'block_hash': block.hash
                        })
                        continue

                    block_info = {
                        'data': block.data,
                        'timestamp': block.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                        'created_by': block.creator_address,
                        'created_by_name': self.user_profiles.get(block.creator_address, {}).get('nama', 'Unknown') if isinstance(self.user_profiles.get(block.creator_address), dict) else self.user_profiles.get(block.creator_address).nama if self.user_profiles.get(block.creator_address) else 'Unknown',
                        'expiry_date': block.expiry_date.strftime("%Y-%m-%d"),
                        'block_hash': block.hash
                    }

                    # Public data - accessible by medical staff
                    if block.access_level == 'public':
                        if role in self.authorized_roles['public']:
                            patient_data['public'].append(block_info)

                    # Private data - needs multisig for patient/family
                    elif block.access_level == 'private':
                        if role in self.authorized_roles['private']:
                            patient_data['private'].append(block_info)
                        elif needs_multisig and multisig_approved:
                            patient_data['private'].append(block_info)

                    # Patient-specific data
                    elif block.access_level == 'patient':
                        if is_patient_or_family:
                            patient_data['patient'].append(block_info)
                        elif role in self.authorized_roles['private'] + self.authorized_roles['public']:
                            patient_data['patient'].append(block_info)

        except Exception as e:
            print(f"Error retrieving patient data: {e}")

        return patient_data

    def login_with_private_key(self, private_key_hex):
        """Login with private key"""
        wallet_info = WalletManager.get_public_key_from_private(private_key_hex)
        if not wallet_info:
            return {"error": "Invalid private key"}

        address = wallet_info['address']
        if address not in self.user_roles:
            return {"error": "User not registered in the system"}

        role = self.user_roles[address]
        profile = self.user_profiles.get(address)

        patient_id = None
        for pid, addresses in self.patient_addresses.items():
            if address in addresses:
                patient_id = pid
                break

        return {
            "address": address,
            "role": role,
            "patient_id": patient_id,
            "profile": profile.to_dict() if profile else None,
            "wallet_info": wallet_info,
            "can_access_private": role in self.authorized_roles['private']
        }

    def login_with_address(self, address):
        """Login with address"""
        if address not in self.user_roles:
            return {"error": "User not registered in the system"}

        role = self.user_roles[address]
        profile = self.user_profiles.get(address)

        patient_id = None
        for pid, addresses in self.patient_addresses.items():
            if address in addresses:
                patient_id = pid
                break

        return {
            "address": address,
            "role": role,
            "patient_id": patient_id,
            "profile": profile.to_dict() if profile else None,
            "can_access_private": role in self.authorized_roles['private']
        }

    def verify_chain(self):
        """Verify blockchain integrity"""
        try:
            for i in range(1, len(self.chain)):
                current_block = self.chain[i]
                previous_block = self.chain[i-1]

                if current_block.hash != current_block.calculate_hash():
                    print(f"Block {i} hash is invalid")
                    return False

                if current_block.previous_hash != previous_block.hash:
                    print(f"Block {i} previous hash doesn't match")
                    return False

            return True
        except Exception as e:
            print(f"Error verifying chain: {e}")
            return False


# ============= INTERACTIVE MENU SYSTEM =============

def print_menu():
    print("\n" + "="*70)
    print("\t\tRS MediTrust - Blockchain Health System")
    print("="*70)
    print("1.  Register New User (Auto-generate wallet)")
    print("2.  Register User with Existing Private Key")
    print("3.  Add Health Data")
    print("4.  Login with Private Key")
    print("5.  Login with Address")
    print("6.  View Patient Data (Standard Access)")
    print("7.  Create Multi-Signature Access Request (For Patient)")
    print("8.  Sign Access Request (Doctor/Komite Medis)")
    print("9.  View Patient Data with Multi-Sig Approval")
    print("10. Convert Patient to Ex-Patient")
    print("11. View All Registered Users")
    print("12. Clean Expired Data (5+ years old)")
    print("13. Verify Blockchain Integrity")
    print("14. Run Demo (Auto)")
    print("0.  Exit")
    print("="*70)

def get_user_credentials():
    """Get user credential information"""
    print("\n--- Enter User Credentials ---")
    nama = input("Full Name: ").strip()
    umur = input("Age: ").strip()
    no_identitas = input("ID Number (KTP/SIP/STR): ").strip()
    alamat = input("Address: ").strip()
    no_telp = input("Phone Number: ").strip()
    specialization = None

    return {
        'nama': nama,
        'umur': umur,
        'no_identitas': no_identitas,
        'alamat': alamat,
        'no_telp': no_telp,
        'specialization': specialization
    }

def register_new_user(blockchain):
    print("\n--- REGISTER NEW USER ---")
    print("Available roles:")
    print("- suster (Nurse)")
    print("- doc (Doctor)")
    print("- komite_medis (Medical Committee)")
    print("- direktur (Director)")
    print("- patient (Active Patient)")
    print("- ex-patient (Ex Patient)")
    print("- family (Family Member)")

    role = input("\nEnter role: ").strip().lower()

    # Get credentials
    credentials = get_user_credentials()

    # Add specialization for doctor
    if role == 'doc':
        credentials['specialization'] = input("Specialization: ").strip()

    patient_id = None
    if role in ['patient', 'ex-patient', 'family']:
        patient_id = input("Enter Patient ID: ").strip()

    wallet = blockchain.register_user(role, credentials, patient_id=patient_id)

    if wallet:
        print("\n✓ User registered successfully!")
        print(f"Role: {role}")
        print(f"Name: {credentials['nama']}")
        print(f"Private Key: {wallet['private_key_hex']}")
        print(f"Address: {wallet['address']}")
        print("\n⚠️  IMPORTANT: Save your private key securely!")
        if patient_id:
            print(f"Patient ID: {patient_id}")
    else:
        print("\n✗ Failed to register user")

def register_with_private_key(blockchain):
    print("\n--- REGISTER WITH EXISTING PRIVATE KEY ---")
    private_key = input("Enter your private key (64 hex characters): ").strip()

    print("\nAvailable roles:")
    print("- suster, doc, komite_medis, direktur, patient, ex-patient, family")
    role = input("Enter role: ").strip().lower()

    # Get credentials
    credentials = get_user_credentials()

    if role == 'doc':
        credentials['specialization'] = input("Specialization: ").strip()

    patient_id = None
    if role in ['patient', 'ex-patient', 'family']:
        patient_id = input("Enter Patient ID: ").strip()

    wallet = blockchain.register_user(role, credentials, private_key_hex=private_key, patient_id=patient_id)

    if wallet:
        print("\n✓ User imported successfully!")
        print(f"Role: {role}")
        print(f"Name: {credentials['nama']}")
        print(f"Address: {wallet['address']}")
        if patient_id:
            print(f"Patient ID: {patient_id}")
    else:
        print("\n✗ Failed to import user")

def add_health_data(blockchain):
    print("\n--- ADD HEALTH DATA ---")
    patient_id = input("Enter Patient ID: ").strip()

    print("\nAccess Level:")
    print("- public: Accessible by all medical staff")
    print("- private: Only komite_medis and direktur (requires multisig for patient)")
    print("- patient: Accessible by patient/family and medical staff")
    access_level = input("Enter access level: ").strip().lower()

    user_address = input("Enter your address: ").strip()

    print("\nEnter data (format: key=value, separated by comma)")
    print("Example: nama=John Doe,umur=30,diagnosis=Diabetes")
    data_str = input("Data: ").strip()

    data = {}
    for item in data_str.split(','):
        if '=' in item:
            key, value = item.split('=', 1)
            data[key.strip()] = value.strip()

    expiry_years = input("\nExpiry years (default 5): ").strip()
    expiry_years = int(expiry_years) if expiry_years else 5

    success = blockchain.add_block(patient_id, data, access_level, user_address, expiry_years)

    if success:
        print("\n✓ Health data added successfully!")
        print(f"Data will expire in {expiry_years} years")
    else:
        print("\n✗ Failed to add health data (check authorization)")

def create_access_request(blockchain):
    print("\n--- CREATE MULTI-SIGNATURE ACCESS REQUEST ---")
    print("(For patient/family to access private data)")

    patient_id = input("Enter Patient ID: ").strip()
    requester_address = input("Enter your address (patient/family): ").strip()

    print("\nData type to request:")
    print("- private: Sensitive medical data")
    print("- patient: Patient-specific data")
    data_type = input("Enter data type: ").strip().lower()

    request_id = blockchain.create_access_request(patient_id, requester_address, data_type)

    print(f"\n✓ Access request created!")
    print(f"Request ID: {request_id}")
    print("\nShare this Request ID with doctor and medical committee to get approval.")
    print("Need 2 signatures: 1 from doctor + 1 from medical committee")

def sign_access_request(blockchain):
    print("\n--- SIGN ACCESS REQUEST ---")
    print("(Only for doctor/medical committee)")

    request_id = input("Enter Request ID: ").strip()
    signer_address = input("Enter your address: ").strip()
    private_key = input("Enter your private key: ").strip()

    success, message = blockchain.sign_access_request(request_id, signer_address, private_key)

    if success:
        request = blockchain.access_requests[request_id]
        print(f"\n✓ {message}")
        print(f"Signatures collected: {len(request.signatures)}/{request.required_signatures}")
        print(f"Status: {request.status}")
    else:
        print(f"\n✗ {message}")

def view_patient_data_with_multisig(blockchain):
    print("\n--- VIEW PATIENT DATA (WITH MULTI-SIG) ---")
    patient_id = input("Enter Patient ID: ").strip()
    user_address = input("Enter your address: ").strip()
    request_id = input("Enter approved Request ID (optional): ").strip()

    request_id = request_id if request_id else None
    data = blockchain.get_patient_data(patient_id, user_address, request_id)

    print(f"\n{'='*70}")
    print(f"Patient {patient_id} Medical Records")
    print(f"{'='*70}")

    print("\n[PUBLIC DATA]")
    if data['public']:
        for i, item in enumerate(data['public'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No public data available")

    print("\n[PRIVATE DATA]")
    if data['private']:
        for i, item in enumerate(data['private'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No private data accessible (may need multi-signature approval)")

    print("\n[PATIENT DATA]")
    if data['patient']:
        for i, item in enumerate(data['patient'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No patient-specific data accessible")

    print("\n[EXPIRED DATA]")
    if data['expired']:
        print(f"Total expired records: {len(data['expired'])}")
        for i, item in enumerate(data['expired'], 1):
            print(f"{i}. {item['data']} - Expired on {item['expired_date']}")
    else:
        print("No expired data")

def convert_to_ex_patient(blockchain):
    print("\n--- CONVERT PATIENT TO EX-PATIENT ---")
    patient_id = input("Enter Patient ID: ").strip()

    confirm = input(f"Convert patient {patient_id} to ex-patient? (yes/no): ").strip().lower()

    if confirm == 'yes':
        success = blockchain.convert_patient_to_ex_patient(patient_id)
        if success:
            print(f"\n✓ Patient {patient_id} converted to ex-patient successfully!")
        else:
            print(f"\n✗ Failed to convert patient {patient_id}")
    else:
        print("\nOperation cancelled")

def view_patient_data_standard(blockchain):
    print("\n--- VIEW PATIENT DATA (STANDARD) ---")
    patient_id = input("Enter Patient ID: ").strip()
    user_address = input("Enter your address: ").strip()

    data = blockchain.get_patient_data(patient_id, user_address)

    print(f"\n{'='*70}")
    print(f"Patient {patient_id} Medical Records")
    print(f"{'='*70}")

    print("\n[PUBLIC DATA]")
    if data['public']:
        for i, item in enumerate(data['public'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No public data available")

    print("\n[PRIVATE DATA]")
    if data['private']:
        for i, item in enumerate(data['private'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No private data accessible")

    print("\n[PATIENT DATA]")
    if data['patient']:
        for i, item in enumerate(data['patient'], 1):
            print(f"\n{i}. {item['data']}")
            print(f"   Created by: {item['created_by_name']} ({item['created_by'][:10]}...)")
            print(f"   Timestamp: {item['timestamp']}")
            print(f"   Expires: {item['expiry_date']}")
    else:
        print("No patient-specific data accessible")

    print("\n[EXPIRED DATA]")
    if data['expired']:
        print(f"Total expired records: {len(data['expired'])}")
        for i, item in enumerate(data['expired'], 1):
            print(f"{i}. {item['data']} - Expired on {item['expired_date']}")
    else:
        print("No expired data")

def login_with_private_key_menu(blockchain):
    print("\n--- LOGIN WITH PRIVATE KEY ---")
    private_key = input("Enter your private key: ").strip()

    result = blockchain.login_with_private_key(private_key)

    if "error" in result:
        print(f"\n✗ Login failed: {result['error']}")
    else:
        print("\n✓ Login successful!")
        print(f"Name: {result['profile']['nama']}")
        print(f"Address: {result['address']}")
        print(f"Role: {result['role']}")
        print(f"Can access private data: {result['can_access_private']}")
        if result.get('patient_id'):
            print(f"Patient ID: {result['patient_id']}")
        print(f"\nFull Profile: {json.dumps(result['profile'], indent=2)}")

def login_with_address_menu(blockchain):
    print("\n--- LOGIN WITH ADDRESS ---")
    address = input("Enter your address: ").strip()

    result = blockchain.login_with_address(address)

    if "error" in result:
        print(f"\n✗ Login failed: {result['error']}")
    else:
        print("\n✓ Login successful!")
        print(f"Name: {result['profile']['nama']}")
        print(f"Address: {result['address']}")
        print(f"Role: {result['role']}")
        print(f"Can access private data: {result['can_access_private']}")
        if result.get('patient_id'):
            print(f"Patient ID: {result['patient_id']}")
        print(f"\nFull Profile: {json.dumps(result['profile'], indent=2)}")

def view_all_users(blockchain):
    print("\n--- REGISTERED USERS ---")
    for role, users in blockchain.users.items():
        print(f"\n[{role.upper()}]")
        for address, wallet in users.items():
            profile = blockchain.user_profiles.get(address)
            print(f"  Name: {profile.nama if profile else 'N/A'}")
            print(f"  Address: {address}")
            print(f"  Private Key: {wallet['private_key_hex'][:20]}...")
            if profile:
                print(f"  Phone: {profile.no_telp}")
                print(f"  ID: {profile.no_identitas}")
            print()

def clean_expired_data(blockchain):
    print("\n--- CLEAN EXPIRED DATA ---")
    print("Scanning blockchain for expired data (5+ years old)...")

    expired_count = blockchain.clean_expired_blocks()

    print(f"\n✓ Scan completed!")
    print(f"Total expired blocks marked: {expired_count}")
    print("\nNote: Expired data is marked but kept in blockchain for audit trail.")
    print("Expired data content is replaced with '[EXPIRED - Data removed after 5 years]'")

def run_demo(blockchain):
    print("\n" + "="*70)
    print("RUNNING COMPREHENSIVE DEMO")
    print("="*70)

    # Register medical staff
    print("\n1. Registering medical staff...")

    suster_wallet = blockchain.register_user("suster", {
        'nama': 'Siti Nurhaliza',
        'umur': '28',
        'no_identitas': 'SIP123456',
        'alamat': 'Jakarta',
        'no_telp': '081234567890'
    })

    doc_wallet = blockchain.register_user("doc", {
        'nama': 'Dr. Budi Santoso',
        'umur': '35',
        'no_identitas': 'STR789012',
        'alamat': 'Jakarta',
        'no_telp': '081234567891',
        'specialization': 'Cardiologist'
    })

    komite_wallet = blockchain.register_user("komite_medis", {
        'nama': 'Prof. Dr. Ahmad Wijaya',
        'umur': '45',
        'no_identitas': 'STR345678',
        'alamat': 'Jakarta',
        'no_telp': '081234567892'
    })

    # Register patient
    print("\n2. Registering patient...")
    patient_wallet = blockchain.register_user("patient", {
        'nama': 'John Doe',
        'umur': '30',
        'no_identitas': '3201234567890123',
        'alamat': 'Bandung',
        'no_telp': '081234567893'
    }, patient_id="P001")

    # Register family
    print("\n3. Registering family member...")
    family_wallet = blockchain.register_user("family", {
        'nama': 'Jane Doe',
        'umur': '28',
        'no_identitas': '3201234567890124',
        'alamat': 'Bandung',
        'no_telp': '081234567894'
    }, patient_id="P001")

    print("\n✓ All users registered successfully!")
    print(f"\nPatient Details:")
    print(f"  Name: John Doe")
    print(f"  Patient ID: P001")
    print(f"  Address: {patient_wallet['address']}")
    print(f"  Private Key: {patient_wallet['private_key_hex']}")

    # Add health data
    print("\n4. Adding health data...")

    # Public data by nurse
    blockchain.add_block("P001", {
        "nama": "John Doe",
        "umur": 30,
        "alamat": "Bandung"
    }, "public", suster_wallet['address'])

    # Public checkup by doctor
    blockchain.add_block("P001", {
        "berat": 70,
        "tinggi": 170,
        "tensi": "120/80",
        "diagnosis": "Hipertensi ringan"
    }, "public", doc_wallet['address'])

    # Private lab results
    blockchain.add_block("P001", {
        "goldar": "A",
        "hb": 14.5,
        "leukosit": 8000,
        "penyakit_khusus": "Diabetes Type 2"
    }, "private", komite_wallet['address'])

    # Patient personal notes
    blockchain.add_block("P001", {
        "alergi": "Seafood",
        "riwayat_keluarga": "Diabetes, Hipertensi",
        "catatan": "Rutin olahraga 3x seminggu"
    }, "patient", patient_wallet['address'])

    print("\n5. Testing data access...")

    # Standard access (medical staff)
    print("\n[DOCTOR VIEW]")
    doc_data = blockchain.get_patient_data("P001", doc_wallet['address'])
    print(f"Public records: {len(doc_data['public'])}")
    print(f"Private records: {len(doc_data['private'])} (No access)")
    print(f"Patient records: {len(doc_data['patient'])}")

    # Komite medis (full access)
    print("\n[MEDICAL COMMITTEE VIEW]")
    komite_data = blockchain.get_patient_data("P001", komite_wallet['address'])
    print(f"Public records: {len(komite_data['public'])}")
    print(f"Private records: {len(komite_data['private'])} (Full access)")
    print(f"Patient records: {len(komite_data['patient'])}")

    # Patient access (needs multisig for private)
    print("\n[PATIENT VIEW - Without Multi-Sig]")
    patient_data = blockchain.get_patient_data("P001", patient_wallet['address'])
    print(f"Public records: {len(patient_data['public'])}")
    print(f"Private records: {len(patient_data['private'])} (Need approval)")
    print(f"Patient records: {len(patient_data['patient'])}")

    # Multi-signature flow
    print("\n6. Testing multi-signature access...")
    print("\nPatient creates access request for private data:")
    request_id = blockchain.create_access_request("P001", patient_wallet['address'], "private")
    print(f"Request ID: {request_id}")

    print("\nDoctor signs the request:")
    blockchain.sign_access_request(request_id, doc_wallet['address'], doc_wallet['private_key_hex'])

    print("Medical committee signs the request:")
    blockchain.sign_access_request(request_id, komite_wallet['address'], komite_wallet['private_key_hex'])

    print("\n[PATIENT VIEW - With Multi-Sig Approval]")
    patient_data_approved = blockchain.get_patient_data("P001", patient_wallet['address'], request_id)
    print(f"Public records: {len(patient_data_approved['public'])}")
    print(f"Private records: {len(patient_data_approved['private'])} (Approved!)")
    print(f"Patient records: {len(patient_data_approved['patient'])}")

    # Convert to ex-patient
    print("\n7. Converting patient to ex-patient...")
    blockchain.convert_patient_to_ex_patient("P001")
    print("✓ Patient P001 is now ex-patient")

    # Verify blockchain
    print("\n8. Verifying blockchain integrity...")
    is_valid = blockchain.verify_chain()
    print(f"Blockchain is {'VALID ✓' if is_valid else 'INVALID ✗'}")
    print(f"Total blocks: {len(blockchain.chain)}")

    print("\n" + "="*70)
    print("DEMO COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\nKey Features Demonstrated:")
    print("✓ User registration with credentials")
    print("✓ Multiple roles (staff, patient, ex-patient, family)")
    print("✓ Three-level access control (public, private, patient)")
    print("✓ Multi-signature approval for sensitive data")
    print("✓ Data expiry system (5 years)")
    print("✓ Patient to ex-patient conversion")
    print("✓ Blockchain integrity verification")

def main():
    blockchain = HealthBlockchain()

    while True:
        print_menu()
        choice = input("\nEnter your choice: ").strip()

        if choice == '1':
            register_new_user(blockchain)
        elif choice == '2':
            register_with_private_key(blockchain)
        elif choice == '3':
            add_health_data(blockchain)
        elif choice == '4':
            login_with_private_key_menu(blockchain)
        elif choice == '5':
            login_with_address_menu(blockchain)
        elif choice == '6':
            view_patient_data_standard(blockchain)
        elif choice == '7':
            create_access_request(blockchain)
        elif choice == '8':
            sign_access_request(blockchain)
        elif choice == '9':
            view_patient_data_with_multisig(blockchain)
        elif choice == '10':
            convert_to_ex_patient(blockchain)
        elif choice == '11':
            view_all_users(blockchain)
        elif choice == '12':
            clean_expired_data(blockchain)
        elif choice == '13':
            is_valid = blockchain.verify_chain()
            print(f"\nBlockchain is {'VALID ✓' if is_valid else 'INVALID ✗'}")
            print(f"Total blocks: {len(blockchain.chain)}")
        elif choice == '14':
            run_demo(blockchain)
        elif choice == '0':
            print("\nExiting... Thank you for using RS MediTrust!")
            break
        else:
            print("\n✗ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()