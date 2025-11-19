# ServiceNow + OpenAI: Automated Knowledge Article Generator

A small integration project demonstrating how to embed OpenAI’s GPT models into ServiceNow to automatically generate Knowledge Base articles directly from Incidents.

This project uses:
- ServiceNow Script Includes  
- REST Message V2  
- OpenAI Chat Completions API  
- Secure system properties  
- UI Actions for user-initiated generation  

---

## 🚀 Project Overview

This integration enables ServiceNow users to click a button on an Incident and automatically:

1. Extract structured incident metadata  
2. Send a text prompt to the OpenAI API  
3. Receive a generated Knowledge Base article  
4. Create the KB article in draft state  
5. Optionally link it back to the Incident  

This reduces manual documentation effort and builds reusable knowledge from real incidents.

---

## 🧠 Motivation

I built this to explore how OpenAI’s models can be embedded into real enterprise workflows, not just as a chatbot, but as a **documentation agent** inside ITSM.

It demonstrates:

- Practical LLM integration into a legacy enterprise platform (ServiceNow)  
- Secure data handling using system properties and controlled field selection  
- REST-driven orchestration using ServiceNow’s `sn_ws.RESTMessageV2`  
- Real business value: converting incident resolutions into reusable KB, automatically  

This aligns with my interest in building **agentic workflows** powered by OpenAI models.

---

## 📂 Repository Structure

```text
.
├── README.md
├── src/
│   ├── script_include_OpenAIKBGenerator.js   # Core logic to call OpenAI and create KB
│   ├── ui_action_generate_kb.js              # UI Action on Incident to trigger generation
│   └── openai_rest_message.json              # Example REST Message definition (for reference)
└── docs/
    ├── flow_explanation.md                   # End-to-end explanation of the flow
    ├── security_model.md                     # Notes on API key + data security
    └── demo_screenshots/                     # (Optional) Screenshots of it running
