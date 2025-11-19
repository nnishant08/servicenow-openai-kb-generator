var OpenAIKBGenerator = Class.create();
OpenAIKBGenerator.prototype = {
    initialize: function() {},

    generateKBFromIncident: function(incidentSysId) {
        if (!incidentSysId) {
            gs.error('OpenAIKBGenerator: Incident sys_id is required');
            return null;
        }

        // 1. Load the incident
        var inc = new GlideRecord('incident');
        if (!inc.get(incidentSysId)) {
            gs.error('OpenAIKBGenerator: Incident not found for sys_id=' + incidentSysId);
            return null;
        }

        // 2. Prepare prompt content from incident
        var incidentNumber = inc.getValue('number');
        var shortDesc      = inc.getValue('short_description');
        var description    = inc.getValue('description');
        var category       = inc.getValue('category');
        var subcategory    = inc.getValue('subcategory');
        var ci             = inc.getDisplayValue('cmdb_ci');
        var assignmentGrp  = inc.getDisplayValue('assignment_group');
        var closeNotes     = inc.getValue('close_notes');

        // Build a structured text with incident info
        var incidentContext = ''
            + 'Incident Number: ' + incidentNumber + '\n'
            + 'Short Description: ' + shortDesc + '\n'
            + 'Description: ' + description + '\n'
            + 'Category/Subcategory: ' + category + ' / ' + subcategory + '\n'
            + 'Configuration Item: ' + ci + '\n'
            + 'Assignment Group: ' + assignmentGrp + '\n'
            + 'Resolution / Close Notes: ' + closeNotes + '\n';

        // 3. Build OpenAI request payload (chat completion)
        var requestBody = {
            model: 'gpt-4.1-mini',  // change model if needed
            messages: [
                {
                    role: 'system',
                    content: 'You are a senior IT support engineer who writes high-quality, reusable knowledge base articles. '
                           + 'Write in clear, concise language, suitable for end users where possible. '
                           + 'Structure your answer with headings like: Problem, Environment, Symptoms, Root Cause, Resolution Steps, Prevention.'
                },
                {
                    role: 'user',
                    content: 'Based on the following incident details, create a reusable knowledge base article:\n\n' + incidentContext
                }
            ],
            temperature: 0.2
        };

        // 4. Call the REST Message to OpenAI
        try {
            var rm = new sn_ws.RESTMessageV2('OpenAI - Chat Completions', 'POST - Chat');

            // Override the default request body with our dynamic JSON
            rm.setRequestBody(JSON.stringify(requestBody));

            var response = rm.execute();
            var httpStatus = response.getStatusCode();
            var respBody = response.getBody();

            if (httpStatus != 200) {
                gs.error('OpenAIKBGenerator: OpenAI API error. Status=' + httpStatus + ', Body=' + respBody);
                return null;
            }

            var respObj = JSON.parse(respBody);

            if (!respObj || !respObj.choices || !respObj.choices[0]) {
                gs.error('OpenAIKBGenerator: Unexpected OpenAI response: ' + respBody);
                return null;
            }

            var articleContent = respObj.choices[0].message.content;

            // 5. Create the KB article (draft)
            var kb = new GlideRecord('kb_knowledge');
            kb.initialize();

            // Choose a KB knowledge base – hardcode or make it configurable
            // e.g., "IT Knowledge Base" – you might want to look up by name
            var kbBaseId = this._getDefaultKBBase(); // helper function below
            if (kbBaseId)
                kb.setValue('kb_knowledge_base', kbBaseId);

            kb.setValue('short_description', 'KB from ' + incidentNumber + ': ' + shortDesc);
            kb.setValue('text', articleContent);
            kb.setValue('workflow_state', 'draft'); // or 'published' depending on your process

            var kbSysId = kb.insert();

            if (!kbSysId) {
                gs.error('OpenAIKBGenerator: Failed to create KB article');
                return null;
            }

            // 6. Optionally link KB to incident (if you use a relationship)
            // Many orgs use the "Knowledge" related list on incident (task_rel_task, etc.)
            // Example: add a record to the task_rel_task table
            try {
                var rel = new GlideRecord('task_rel_task');
                rel.initialize();
                rel.setValue('parent', incidentSysId);
                rel.setValue('child', kbSysId);
                rel.setValue('type', 'KB'); // use a valid relationship type in your instance
                rel.insert();
            } catch (ex) {
                gs.warn('OpenAIKBGenerator: Failed to create task relationship: ' + ex.message);
            }

            gs.addInfoMessage('AI-generated KB article created: ' + kb.getDisplayValue('number'));

            return kbSysId;

        } catch (e) {
            gs.error('OpenAIKBGenerator: Exception while calling OpenAI - ' + e.message);
            return null;
        }
    },

    _getDefaultKBBase: function() {
        
        var kbBase = new GlideRecord('kb_knowledge_base');
        kbBase.addQuery('title', 'IT'); // KB Base
        kbBase.query();
        if (kbBase.next()) {
            return kbBase.getUniqueValue();
        }
        return '';
    },

    type: 'OpenAIKBGenerator'
};
