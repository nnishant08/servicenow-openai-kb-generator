// Server-side UI Action script
(function() {
    var generator = new OpenAIKBGenerator();
    var kbSysId = generator.generateKBFromIncident(current.sys_id);

    if (kbSysId) {
        gs.addInfoMessage('Knowledge article generated successfully.');
    } else {
        gs.addErrorMessage('Failed to generate Knowledge article. Check logs for details.');
    }

    action.setRedirectURL(current); // stay on the incident
})();
