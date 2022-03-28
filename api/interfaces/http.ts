interface httpResponse {
  messages: httpMessage[];
  success: boolean;
  data: Partial<any>;
}

interface httpMessage {
  code: 200 | 300 | 400 | 401 | 403 | 500 | 404 | 503 | 402 | 409;
  sysCode: string;
  displayText: string;
  displayHeader: string;
  event: string;
  isError: boolean;
}

export { httpResponse };
