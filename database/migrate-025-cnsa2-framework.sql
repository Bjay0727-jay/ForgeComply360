-- ============================================================================
-- MIGRATION 025: CNSA 2.0 (NSA) Framework
-- ============================================================================
-- Adds the Commercial National Security Algorithm Suite 2.0 framework
-- definition, 16 controls across 5 families, and crosswalk mappings to
-- NIST 800-53 R5, CMMC L2, and ISO 27001.
-- Fully idempotent — safe to re-run on every deploy (INSERT OR REPLACE).
-- ============================================================================

-- Framework definition
INSERT OR REPLACE INTO compliance_frameworks (id, name, version, category, description, control_count, governing_body, assessment_methodology)
VALUES ('cnsa-2', 'CNSA 2.0 (NSA)', '2.0', 'defense',
  'Commercial National Security Algorithm Suite 2.0 — NSA quantum-resistant cryptographic standards for national security systems and defense contractors. Mandates post-quantum algorithms (ML-KEM, ML-DSA), AES-256, and SHA-384/SHA-512 to protect against quantum computing threats.',
  16, 'NSA/CSS', 'Crypto Compliance Assessment');

-- ============================================================================
-- APPROVED ALGORITHMS (CNSA-ALG) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cnsa-2', 'CNSA-ALG-01', 'Approved Algorithms', 'Cryptographic Algorithm Inventory',
 'Maintain a comprehensive inventory of all cryptographic algorithms in use across the organization. For each algorithm, document its purpose, key sizes, operational context, and whether it meets CNSA 2.0 approved algorithm requirements. Identify legacy algorithms (RSA, ECDSA, ECDH, SHA-1, 3DES, RC4) with documented transition timelines. Reference: FIPS 197 (AES), FIPS 180-4 (SHA-2), FIPS 203 (ML-KEM), FIPS 204 (ML-DSA).',
 'P1', 1, 1, 1, 1),
('cnsa-2', 'CNSA-ALG-02', 'Approved Algorithms', 'Algorithm Selection Policy',
 'Establish and enforce organizational policy requiring selection of CNSA 2.0 approved algorithms for all new system deployments and significant upgrades: AES-256 for symmetric encryption, SHA-384 or SHA-512 for hashing, ML-DSA (CRYSTALS-Dilithium, FIPS 204) for digital signatures, and ML-KEM (CRYSTALS-Kyber, FIPS 203) for key encapsulation. Policy must address algorithm selection for data at rest, data in transit, key exchange, authentication, and integrity verification.',
 'P1', 1, 1, 1, 2),
('cnsa-2', 'CNSA-ALG-03', 'Approved Algorithms', 'Non-Approved Algorithm Remediation',
 'Identify and document all uses of non-approved algorithms with remediation plans aligned to NSA transition deadlines: software and firmware signing by 2025, web browsers and servers by 2025, traditional networking equipment by 2026, operating systems by 2027, custom and niche applications by 2030. Track remediation progress and report exceptions through the POA&M process.',
 'P1', 1, 1, 1, 3);

-- ============================================================================
-- SYMMETRIC ENCRYPTION & HASHING (CNSA-SH) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cnsa-2', 'CNSA-SH-01', 'Symmetric Encryption and Hashing', 'Symmetric Encryption Standards',
 'Employ AES-256 (FIPS 197) for all symmetric encryption operations. Ensure all encryption modes are approved: GCM (preferred for authenticated encryption), CCM, or CBC with separate integrity verification. Prohibit use of AES-128 for national security applications, and absolutely prohibit DES, 3DES, RC4, Blowfish, and other deprecated symmetric ciphers. Document all symmetric encryption implementations with mode, key size, and IV/nonce management practices.',
 'P1', 1, 1, 1, 4),
('cnsa-2', 'CNSA-SH-02', 'Symmetric Encryption and Hashing', 'Hash Function Standards',
 'Use SHA-384 as the minimum hash function for all security-relevant operations including integrity verification, key derivation, digital signatures, HMAC constructions, and certificate generation. SHA-512 is also approved. SHA-256 is acceptable only for non-security uses such as data deduplication checksums and protocol-mandated operations (e.g., TOTP per RFC 6238, HIBP k-anonymity lookups). Prohibit SHA-1 and MD5 for all security functions. Reference: FIPS 180-4, FIPS 202.',
 'P1', 1, 1, 1, 5),
('cnsa-2', 'CNSA-SH-03', 'Symmetric Encryption and Hashing', 'Key Derivation Function Standards',
 'Ensure all key derivation functions (HKDF per RFC 5869, PBKDF2 per SP 800-132, SP 800-108 KDF) employ SHA-384 or SHA-512 as the underlying hash function. Derive symmetric keys of at least 256 bits. For password-based key derivation, use minimum 100,000 iterations with unique per-user salts of at least 128 bits. Document all KDF implementations, their parameters, and key derivation chains.',
 'P1', 1, 1, 1, 6);

-- ============================================================================
-- POST-QUANTUM CRYPTOGRAPHY (CNSA-PQC) — 4 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cnsa-2', 'CNSA-PQC-01', 'Post-Quantum Cryptography', 'ML-KEM Key Encapsulation',
 'Implement ML-KEM (CRYSTALS-Kyber, FIPS 203) for all key establishment and key exchange operations replacing ECDH, DH, and RSA key transport. Use ML-KEM-1024 parameter set for national security applications. Where ML-KEM is not yet supported by the platform or library, document the gap in POA&M, implement hybrid approaches per CNSA-PQC-03, and track vendor/platform roadmaps for ML-KEM availability.',
 'P1', 1, 1, 1, 7),
('cnsa-2', 'CNSA-PQC-02', 'Post-Quantum Cryptography', 'ML-DSA Digital Signatures',
 'Implement ML-DSA (CRYSTALS-Dilithium, FIPS 204) for all digital signature operations including code signing, document signing, certificate issuance, and protocol authentication. Use ML-DSA-87 parameter set for national security applications. SLH-DSA (SPHINCS+, NIST SP 800-208) is approved as an alternative hash-based signature scheme. Where ML-DSA is not yet available, maintain classical signatures with documented transition plans.',
 'P1', 1, 1, 1, 8),
('cnsa-2', 'CNSA-PQC-03', 'Post-Quantum Cryptography', 'Hybrid Cryptographic Approaches',
 'During the transition period to post-quantum cryptography, implement hybrid cryptographic approaches that combine classical algorithms with post-quantum algorithms for key exchange and digital signatures. Ensure that compromise of either the classical or post-quantum component alone does not compromise overall security. Document hybrid configurations including algorithm pairs, key sizes, and planned sunset dates for classical-only components. Example: X25519 + ML-KEM-768 for TLS key exchange.',
 'P2', 1, 1, 1, 9),
('cnsa-2', 'CNSA-PQC-04', 'Post-Quantum Cryptography', 'Post-Quantum Readiness Assessment',
 'Conduct periodic assessment of organizational readiness for post-quantum migration. Evaluate platform and library support for ML-KEM and ML-DSA, identify all systems using vulnerable asymmetric algorithms (RSA, ECDSA, ECDH), assess vendor PQC roadmaps, and maintain a crypto agility plan enabling algorithm substitution without architectural changes. Address "harvest now, decrypt later" threat to long-lived classified or sensitive data by prioritizing encryption-in-transit upgrades.',
 'P1', 1, 1, 1, 10);

-- ============================================================================
-- KEY MANAGEMENT (CNSA-KM) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cnsa-2', 'CNSA-KM-01', 'Key Management', 'Key Generation and Entropy',
 'Generate all cryptographic keys using NIST-approved random number generators (SP 800-90A) with sufficient entropy from hardware or OS-level CSPRNG sources. Symmetric keys must be at least 256 bits. ML-KEM and ML-DSA key generation must follow FIPS 203/204 parameter requirements. Document all key generation processes, entropy sources, and seeding mechanisms. Validate entropy quality for production key generation environments.',
 'P1', 1, 1, 1, 11),
('cnsa-2', 'CNSA-KM-02', 'Key Management', 'Key Lifecycle Management',
 'Establish comprehensive key lifecycle management covering generation, distribution, storage, usage, rotation, archival, recovery, and destruction. Define maximum cryptoperiods for each key type aligned with NIST SP 800-57 guidance. Implement automated key rotation where feasible. Ensure keys are stored with protections commensurate to the data they protect — never in plaintext, preferably in HSM or KMS. Maintain key inventory with metadata tracking algorithm, size, creation date, expiry, and custodian.',
 'P1', 1, 1, 1, 12),
('cnsa-2', 'CNSA-KM-03', 'Key Management', 'Cryptographic Key Transition Planning',
 'Develop and maintain a plan for transitioning cryptographic keys and algorithms from classical to post-quantum per NSA CNSA 2.0 timelines. Address re-keying strategies for long-lived data, backward compatibility during transition periods, and dual-algorithm support. Prioritize systems protecting data with long confidentiality requirements (>10 years) due to harvest-now-decrypt-later quantum threats. Plan must include milestones, resource requirements, and risk acceptance for any delayed transitions.',
 'P1', 1, 1, 1, 13);

-- ============================================================================
-- PROTOCOL & IMPLEMENTATION COMPLIANCE (CNSA-PI) — 3 Controls
-- ============================================================================

INSERT OR REPLACE INTO security_controls (framework_id, control_id, family, title, description, priority, baseline_low, baseline_moderate, baseline_high, sort_order) VALUES
('cnsa-2', 'CNSA-PI-01', 'Protocol and Implementation', 'TLS and Transport Security',
 'Configure all TLS implementations to use TLS 1.3 (preferred) or TLS 1.2 with CNSA 2.0 approved cipher suites. Require AES-256-GCM for symmetric encryption within TLS. When platform support is available, enable post-quantum key exchange (ML-KEM hybrid with X25519 or P-384). Disable TLS 1.0, TLS 1.1, and all cipher suites using RSA key exchange, CBC mode, SHA-1, or key sizes below 256 bits. Document all TLS termination points and their cipher suite configurations.',
 'P1', 1, 1, 1, 14),
('cnsa-2', 'CNSA-PI-02', 'Protocol and Implementation', 'Software and Firmware Signing',
 'Sign all software releases, firmware updates, configuration files, and code artifacts using ML-DSA (CRYSTALS-Dilithium) when available, or at minimum RSA-4096 or ECDSA P-384 with SHA-384 during the transition period. Verify signatures before installation or deployment. Maintain a documented chain of trust for all signed artifacts including signing key management, revocation procedures, and timestamping. NSA target: ML-DSA for software signing by 2025 for new systems.',
 'P1', 1, 1, 1, 15),
('cnsa-2', 'CNSA-PI-03', 'Protocol and Implementation', 'Cryptographic Agility Architecture',
 'Design and maintain systems with cryptographic agility — the ability to swap cryptographic algorithms, key sizes, and protocol versions without fundamental architectural changes. Implement abstraction layers for all cryptographic operations (encryption, hashing, signing, key exchange). Avoid hardcoded algorithm selections in application code. Maintain a centralized cryptographic configuration that can be updated independently of application deployments. Conduct periodic crypto agility assessments.',
 'P2', 1, 1, 1, 16);

-- ============================================================================
-- CROSSWALK MAPPINGS — CNSA 2.0 to NIST 800-53 R5
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('cnsa-2', 'CNSA-ALG-01', 'nist-800-53-r5', 'SC-13', 'partial', 0.85, 'Algorithm inventory supports NIST Cryptographic Protection requirements'),
('cnsa-2', 'CNSA-ALG-02', 'nist-800-53-r5', 'SC-13', 'equivalent', 0.90, 'Algorithm selection policy is core of NIST Cryptographic Protection'),
('cnsa-2', 'CNSA-ALG-03', 'nist-800-53-r5', 'SC-13', 'partial', 0.80, 'Remediation planning extends NIST Cryptographic Protection with transition timelines'),
('cnsa-2', 'CNSA-SH-01', 'nist-800-53-r5', 'SC-13', 'partial', 0.85, 'Symmetric encryption is subset of NIST Cryptographic Protection'),
('cnsa-2', 'CNSA-SH-01', 'nist-800-53-r5', 'SC-28', 'partial', 0.80, 'AES-256 for data at rest maps to NIST Protection of Information at Rest'),
('cnsa-2', 'CNSA-SH-02', 'nist-800-53-r5', 'SC-13', 'partial', 0.85, 'Hash function standards are subset of NIST Cryptographic Protection'),
('cnsa-2', 'CNSA-SH-03', 'nist-800-53-r5', 'SC-12', 'partial', 0.80, 'KDF standards relate to NIST Cryptographic Key Establishment and Management'),
('cnsa-2', 'CNSA-PQC-01', 'nist-800-53-r5', 'SC-12', 'partial', 0.75, 'ML-KEM for key encapsulation maps to NIST Key Establishment'),
('cnsa-2', 'CNSA-PQC-02', 'nist-800-53-r5', 'SC-17', 'partial', 0.75, 'ML-DSA for digital signatures maps to NIST PKI Certificates'),
('cnsa-2', 'CNSA-PQC-03', 'nist-800-53-r5', 'SC-8', 'partial', 0.70, 'Hybrid crypto approaches support NIST Transmission Confidentiality and Integrity'),
('cnsa-2', 'CNSA-PQC-04', 'nist-800-53-r5', 'SC-13', 'partial', 0.75, 'PQC readiness extends NIST Cryptographic Protection'),
('cnsa-2', 'CNSA-KM-01', 'nist-800-53-r5', 'SC-12', 'equivalent', 0.90, 'Key generation maps directly to NIST Cryptographic Key Establishment'),
('cnsa-2', 'CNSA-KM-02', 'nist-800-53-r5', 'SC-12', 'equivalent', 0.90, 'Key lifecycle management is core of NIST Key Establishment and Management'),
('cnsa-2', 'CNSA-KM-03', 'nist-800-53-r5', 'SC-12', 'partial', 0.80, 'Key transition planning extends NIST Key Management with PQC timelines'),
('cnsa-2', 'CNSA-PI-01', 'nist-800-53-r5', 'SC-8', 'equivalent', 0.85, 'TLS configuration maps to NIST Transmission Confidentiality and Integrity'),
('cnsa-2', 'CNSA-PI-02', 'nist-800-53-r5', 'SC-13', 'partial', 0.80, 'Software signing is subset of NIST Cryptographic Protection'),
('cnsa-2', 'CNSA-PI-03', 'nist-800-53-r5', 'SC-13', 'partial', 0.75, 'Crypto agility extends NIST Cryptographic Protection');

-- ============================================================================
-- CROSSWALK MAPPINGS — CNSA 2.0 to CMMC Level 2
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('cnsa-2', 'CNSA-SH-01', 'cmmc-l2', 'SC.L2-3.13.11', 'equivalent', 0.90, 'CNSA symmetric encryption maps to CMMC CUI encryption requirement'),
('cnsa-2', 'CNSA-PI-01', 'cmmc-l2', 'SC.L2-3.13.8', 'equivalent', 0.85, 'CNSA TLS requirements map to CMMC transmission confidentiality');

-- ============================================================================
-- CROSSWALK MAPPINGS — CNSA 2.0 to ISO 27001:2022
-- ============================================================================

INSERT OR REPLACE INTO control_crosswalks (source_framework_id, source_control_id, target_framework_id, target_control_id, mapping_type, confidence, notes) VALUES
('cnsa-2', 'CNSA-ALG-02', 'iso-27001', 'A.8.24', 'equivalent', 0.85, 'CNSA algorithm policy maps to ISO Use of Cryptography'),
('cnsa-2', 'CNSA-KM-02', 'iso-27001', 'A.8.24', 'partial', 0.80, 'CNSA key management maps to ISO Use of Cryptography (key management subset)');

-- ============================================================================
-- TRACK MIGRATION
-- ============================================================================
INSERT OR IGNORE INTO schema_migrations (version, name, description) VALUES
  ('migrate-025-cnsa2-framework', 'cnsa2-framework', 'CNSA 2.0 (NSA) framework with 16 controls and crosswalks to NIST 800-53, CMMC L2, ISO 27001');
