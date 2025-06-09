# Webhook Test Server

A simple and configurable webhook test server built with Node.js and Express. This tool allows you to receive, log, and simulate various webhook responses, providing a user-friendly interface to visualize and test incoming webhook data.

## Features

- **Webhook Visualization**: View incoming webhooks in real-time with a clean, organized interface
- **Response Simulation**: Simulate different API responses (200 OK, 404, WhatsApp errors, etc.)
- **Request History**: Maintain a log of recently received webhooks
- **Error Testing**: Test how your systems handle various error responses

## Project Structure

```
webhook-test-server/
├── server.js           # Main server file (Express backend)
├── app.js              # Client-side JavaScript for the interface
├── testwebhook.html    # The HTML interface
├── package.json        # npm configuration
└── README.md           # Documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd webhook-test-server
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Start the server:**
   ```
   npm start
   ```

4. **Access the webhook testing interface:**
   Open your browser and navigate to `http://localhost:3005`.

## Usage

### Receiving Webhooks

Configure your external services to send POST requests to:
```
http://localhost:3005/api/webhook/receive
```
All webhooks will be displayed in the interface automatically.

### Simulating Response Types

The interface allows you to simulate different response types:

- **Valid Response (200)**: Normal successful response
- **404 Error**: Simulate a "Not Found" error
- **Not a WhatsApp User**: Simulate the "Recipient is not a WhatsApp user" error
- **Template Not Approved**: Simulate the "Template not approved" error
- **Phone Not Opted In**: Simulate the "Phone number not opted in" error

### Testing with cURL

You can test the webhook endpoint using cURL:

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":"example"}' \
  http://localhost:3005/api/webhook/receive
```

## API Endpoints

- `POST /api/webhook/receive` - Receive webhooks
- `POST /api/webhook/validate` - Validate JSON payloads
- `GET /api/webhook/history` - Get webhook history
- `POST /api/webhook/clear` - Clear webhook history
- `POST /api/webhook/set-response` - Set response mode
- `GET /api/webhook/get-mode` - Get current response mode

## License

This project is licensed under the MIT License.