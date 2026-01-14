# AI Semantic Web Change Monitor (Apify Actor)

- [x] **Planning**
    - [x] Analyze requirements and defined V1/V2 architecture
    - [x] Create Implementation Plan (V1 & V2 strategy)
    - [x] Review plan with User
    - [x] Define JSON Schema Validation Scripts (Prevent schema drift)
    - [x] Create Mock HTML Test Pages (V1 Verification)
    - [x] Create Architecture Diagram (Mermaid)

- [ ] **V1 Implementation (MVP)**
    - [/] Project Setup (Node.js, Apify SDK, TypeScript setup, Linting/Formatting)
    - [ ] Implement Fetcher (Abstracted for future browser support)
    - [ ] Implement Snapshot Store (KV Store integration)
    - [ ] Develop Diff Engine (Structure-aware, noise reduction, numeric/edge-case tests)
    - [ ] Develop Semantic Classifier (Rule-based)
    - [ ] Integrate AI Interpreter (LLM integration for diff analysis)
    - [ ] Implement Severity Scoring Engine
    - [ ] Create Presets (Config-driven strategy)
    - [ ] Implement Output & Notification logic (Generic Webhook Payload)
    - [ ] Verify V1 functionality (Tests/Manual Run)

- [ ] **V2 Implementation (Extended)**
    - [ ] Implement Change History Store (Pruning strategy: Last N or Last X Days)
    - [ ] Implement Alert Deduplicator (Hash: diff+url+severity, Cooldowns)
    - [ ] Develop Domain-Specific Intelligence Packs (Modular/Pluginable)
    - [ ] Add Explainability Layer (Reasons array, AI Confidence)
    - [ ] Verify V2 functionality

- [ ] **Documentation & Finalization**
    - [ ] Write README.md (Usage, Inputs/Outputs, Presets)
    - [ ] Create Architecture Diagram
    - [ ] Final Code Cleanup & Formatting
