# ✅ **Flow Explanation**

````markdown
# End-to-End Flow: ServiceNow → OpenAI → Knowledge Article Generation

This document explains the complete workflow of generating a Knowledge Base article from an Incident using the OpenAI API.  
It covers what happens from the moment a user clicks the button in ServiceNow to the final KB article creation.

---

# 1. User Trigger (UI Action Click)

The process begins when a ServiceNow user opens an Incident and clicks:

**“Generate KB with AI”**

This UI Action is placed directly on the Incident form.

The action runs a simple server-side script:

```javascript
var gen = new OpenAIKBGenerator();
gen.generateKBFromIncident(current.sys_id);
````

This passes the current Incident’s `sys_id` to the Script Include.

---

# 2. Script Include Starts (Entry Point)

The Script Include `OpenAIKBGenerator` receives the Incident sys_id.

The method:

```
generateKBFromIncident(incidentSysId)
```

is the core entry point of the entire integration.

---

# 3. Script Include Loads the Incident

Inside the Script Include, a GlideRecord query retrieves the Incident:

```javascript
var inc = new GlideRecord('incident');
inc.get(incidentSysId);
```

The following fields are extracted:

* `number`
* `short_description`
* `description`
* `category`
* `subcategory`
* `cmdb_ci` (display value)
* `assignment_group` (display value)
* `close_notes` **or** `comments_and_work_notes`

These fields form the **context** used to build the LLM prompt.

---

# 4. Script Include Builds the Prompt for OpenAI

A structured incident context block is created, for example:

```
Incident Number: INC0012345
Short Description: Email not syncing on Outlook
Description: User reports mailbox not updating...
Category/Subcategory: Email / Outlook
Configuration Item: Exchange Mailbox
Assignment Group: Messaging Support
Resolution Notes: Rebuilt OST file...
```

This context is combined with a **system instruction** telling OpenAI to write a KB article with:

* Problem
* Environment
* Symptoms
* Root Cause
* Resolution
* Validation
* Prevention

The final request body is packaged into a JSON payload for the OpenAI Chat Completions API.

---

# 5. Script Include Calls the OpenAI API (RESTMessageV2)

The Script Include initializes the REST Message:

```javascript
var rm = new sn_ws.RESTMessageV2('OpenAI - Chat', 'POST - Chat');
rm.setRequestBody(JSON.stringify(requestBody));
var response = rm.execute();
```

The REST Message is configured with:

* Endpoint:
  `https://api.openai.com/v1/chat/completions`
* Headers:

  * `Authorization: Bearer ${openai.api.key}`
  * `Content-Type: application/json`
* Body: dynamic JSON set via the Script Include

The API key is stored securely in a system property.

---

# 6. OpenAI Processes the Prompt & Returns Generated KB Content

OpenAI responds with a JSON object containing:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "<generated knowledge article text>"
      }
    }
  ]
}
```

The Script Include extracts:

```
resp.choices[0].message.content
```

This becomes the KB article body.

---

# 7. Script Include Creates a Draft Knowledge Article

A new `kb_knowledge` record is created:

```javascript
var kb = new GlideRecord('kb_knowledge');
kb.initialize();
kb.setValue('short_description', 'KB from INC###: <incident short description>');
kb.setValue('text', articleContent);
kb.setValue('workflow_state', 'draft');
kb.insert();
```

The article is placed in **draft** so the team can review/edit before publishing.

---

# 8. Script Include Links KB Back to the Incident (Optional)

A relationship record is created in `task_rel_task`:

* Parent → Incident
* Child → KB Article
* Type → "KB"

This helps track traceability from Incident to Knowledge.

---

# 9. User Receives Confirmation

ServiceNow displays an on-screen message:

> **Knowledge article generated successfully.**

The user can click into the KB module to review the new AI-generated article.

---

# 10. Summary of the Entire Flow (Diagram)

```
[Incident Form]
        ↓ User clicks button
[UI Action]
        ↓ Calls Script Include
[Script Include]
        ↓ Loads Incident fields
        ↓ Builds prompt
[RESTMessageV2]
        ↓ Sends request to OpenAI API
[OpenAI]
        ↓ Generates KB article text
[ServiceNow]
        ↓ Creates KB (draft)
        ↓ Optional: Links KB to Incident
[User]
        ↓ Sees success message
```

---

# ✔️ Key Benefits of This Flow

* Automates documentation directly from real incidents
* Converts unstructured notes into structured knowledge
* Reduces effort for service desk teams
* Creates consistent article structure using LLMs
* Demonstrates a real-world, agent-like workflow inside ServiceNow

---

```

---

