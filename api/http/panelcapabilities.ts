import { httpResponse } from "../interfaces/http";
import { config } from "../config";

function httpResolve(app: any) {
  app.get("/panelcapabilities", function (req, res) {
    let httpResponse: httpResponse = {
      messages: null,
      data: {
        panel: config.panel,
        api_base_url: config.api.base_url,
        contact: config.contact,
        capabilities: config.capabilities,
        panel_url: config.pterodactyl.server,
        currency: config.currency,
      },
      success: true,
    };
    res.json(httpResponse);
    return;
  });
}

export { httpResolve };
