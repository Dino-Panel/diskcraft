import { httpResponse } from "../interfaces/http";

function httpResolve(app: any) {
  app.get("/status", function (req, res) {
    let httpResponse: httpResponse = {
      messages: null,
      data: {
        txt: "Everything is ok",
      },
      success: true,
    };
    res.json(httpResponse);
    return;
  });
}

export { httpResolve };
