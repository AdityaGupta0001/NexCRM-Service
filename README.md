# NexCRM Service - Backend API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Optional -->

**NexCRM Service is the backend API powering the [NexCRM frontend application](https://github.com/AdityaGupta0001/NexCRM). It handles user authentication, data management for customers, orders, and campaigns, and provides role-based access control.**

This service is built with Node.js and Express.js, designed to be a robust and scalable foundation for NexCRM's functionalities.

## Table of Contents

- [Overview](#overview)
- [Core Functionalities](#core-functionalities)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installing Dependencies](#installing-dependencies)
  - [Environment Variables](#environment-variables)
- [Running the Service](#running-the-service)
  - [Development Mode](#development-mode)
  - [Production Mode (Example)](#production-mode-example)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)
- [License](#license)
- [Contact](#contact)

## Overview

The NexCRM Service acts as the central nervous system for the NexCRM application. It exposes a set of RESTful API endpoints that the frontend consumes to:
*   Authenticate users via Google OAuth.
*   Manage user sessions and roles.
*   Perform CRUD-like operations (especially GET for fetching and POST for importing/creating) for customer and order data.
*   Fetch campaign-related data.
*   Enforce business logic and data validation.

## Core Functionalities

*   **User Authentication**: Secure user login via Google OAuth 2.0.
*   **Session Management**: Manages user sessions for persistent login.
*   **Role-Based Access Control (RBAC)**: Differentiates user capabilities based on roles (e.g., "admin" vs. "user"), particularly for sensitive operations like customer data import/export.
*   **Customer Data Management**: API endpoints to fetch and import customer information.
*   **Order Data Management**: API endpoints to fetch and import order details.
*   **Campaign Data Retrieval**: API endpoint to fetch information related to marketing campaigns.
*   **Data Validation**: Ensures data integrity before processing (implementation details within route handlers).
*   **Structured API Responses**: Provides clear JSON responses, including error messages.

## Tech Stack

*   **Runtime Environment**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Language**: [JavaScript](https://www.javascript.com/) (as indicated by the repository)
*   **Database**: Likely MongoDB (inferred from frontend `_id` usage and typical MERN stacks). Requires confirmation.
*   **ODM (Object Data Mapper)**: Likely [Mongoose](https://mongoosejs.com/) (if using MongoDB). Requires confirmation.
*   **Authentication**:
    *   [Passport.js](http://www.passportjs.org/)
    *   `passport-google-oauth20` strategy
    *   `express-session` for session management
*   **Middleware**:
    *   `cors` for Cross-Origin Resource Sharing.
    *   `body-parser` or `express.json()` for parsing request bodies.
    *   Custom middleware for authentication and authorization checks.
*   **Environment Variables**: `dotenv` to manage environment-specific configurations.

## API Endpoints

The following are the primary API endpoints provided by this service:

### Authentication

*   `GET /api/auth/me`
    *   Description: Retrieves the profile (including role) of the currently authenticated user.
    *   Protection: Requires active session/authentication.
*   `GET /api/auth/google`
    *   Description: Initiates the Google OAuth 2.0 authentication flow.
*   `GET /api/auth/google/callback`
    *   Description: Callback URL for Google OAuth after successful authentication. Handles user creation/login and session establishment.
*   `POST /api/auth/logout` (or `GET /api/auth/logout`)
    *   Description: Logs out the current user by destroying their session.
    *   Protection: Requires active session/authentication.

### Data Management

*   `GET /api/data/customers`
    *   Description: Fetches a list of all customers.
    *   Protection: Requires authentication.
*   `POST /api/data/customers`
    *   Description: Imports new customer data (expects an array of customer objects in JSON format).
    *   Protection: Requires authentication and "admin" role.
*   `GET /api/data/orders`
    *   Description: Fetches a list of all orders.
    *   Protection: Requires authentication.
*   `POST /api/data/orders`
    *   Description: Imports new order data (expects an array of order objects in JSON format).
    *   Protection: Requires authentication.
*   `GET /api/campaigns`
    *   Description: Fetches campaign-related data.
    *   Protection: Requires authentication.

*(Note: Specific request/response body structures for POST endpoints should be documented further, possibly in API documentation or within the code.)*

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version, e.g., v18.x or v20.x, recommended)
*   [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/)
*   Git
*   A running MongoDB instance (or your chosen database)
*   Google OAuth 2.0 Client ID and Client Secret from the [Google Cloud Console](https://console.cloud.google.com/).

## Project Setup

### Cloning the Repository

```
git clone https://github.com/AdityaGupta0001/NexCRM-Service.git
cd NexCRM-Service
```

### Installing Dependencies

Install the project dependencies using npm (or your preferred package manager):

```
npm install
or
pnpm install
or
yarn install
```


### Environment Variables

This project uses environment variables for configuration. Create a `.env` file in the root of the project directory and populate it with the necessary values. See `.env.example` if provided, otherwise use the template below:

```
//Server Configuration
PORT=3000

//Database Configuration (Example for MongoDB)
MONGODB_URI=mongodb://localhost:27017/nexcrm_db

//Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=YOUR_GOOGLE_CALLBACK_URI # Ensure this matches your Google Console setup

//Session Management
SESSION_SECRET=your_very_strong_and_random_session_secret

//Frontend Client Origin (for CORS)
//Replace with the actual URL where your NexCRM frontend is running
CLIENT_ORIGIN=YOUR_ORIGIN

//Add any other environment variables your application needs
//E.g., JWT_SECRET if using JWTs alongside or instead of sessions
```

**Important**:
*   Replace placeholder values (like `YOUR_GOOGLE_CLIENT_ID`) with your actual credentials.
*   Ensure `GOOGLE_CALLBACK_URL` matches the authorized redirect URI in your Google Cloud Console OAuth 2.0 client settings.
*   The `SESSION_SECRET` should be a long, random string for security.

## Running the Service

### Development Mode

To run the service in development mode (usually with hot-reloading if configured, e.g., with `nodemon`):

```
npm run dev
//If 'dev' script is not defined in package.json, use:
npm start
//or node src/server.js (or your main entry file)
```

The service should typically start on the port specified in your `.env` file (defaulting to `3000` in the example). Check your console output for the exact URL.

### Production Mode (Example)

For a production environment, you might have a different script or use a process manager like PM2:

```
npm start
or
pm2 start src/server.js --name nexcrm-service
```


Ensure your environment variables are set appropriately for production.

## Authentication & Authorization

*   **Authentication**: NexCRM Service uses Google OAuth 2.0 via Passport.js. Users are redirected to Google for login. Upon successful authentication, a session is established.
*   **Authorization**: User roles (e.g., "admin", "user") are retrieved via the `/api/auth/me` endpoint. Specific routes, like customer data import/export, check this role to grant or deny access. This is typically handled by custom middleware in the route definitions.

## Error Handling

The API aims to return standard HTTP status codes for different scenarios:
*   `200 OK`: Successful request.
*   `201 Created`: Resource successfully created.
*   `400 Bad Request`: Invalid input or malformed request.
*   `401 Unauthorized`: Authentication failed or missing.
*   `403 Forbidden`: Authenticated user does not have permission for the action.
*   `404 Not Found`: Requested resource does not exist.
*   `500 Internal Server Error`: Unexpected server-side error.

Error responses are typically in JSON format, providing a `message` field with details.

## Contributing

Contributions are welcome! Please follow the standard GitHub flow:
1.  Fork the repository.
2.  Create a new feature or bugfix branch (`git checkout -b feature/your-feature` or `fix/your-bug`).
3.  Make your changes and commit them with clear, descriptive messages.
4.  Push your changes to your forked repository.
5.  Open a Pull Request to the `master` (or `main`) branch of this repository.

Please ensure your code follows any existing style guidelines and include tests if applicable.

## Future Enhancements

*   Implement more granular permissions.
*   Add API rate limiting.
*   Detailed API documentation (e.g., using Swagger/OpenAPI).
*   Implement logging and monitoring.
*   Support for other authentication providers.
*   WebSockets for real-time updates (if needed by frontend features).

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
*(Consider adding an MIT License file to this repository if you haven't already.)*

## Contact

Aditya Gupta - [My GitHub Profile](https://github.com/AdityaGupta0001)
