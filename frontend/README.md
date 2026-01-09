# AllAbroad Frontend

React frontend for the Study Abroad Experts lead generation platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Features

- Modern, responsive design matching the Study Abroad Experts brand
- Lead capture form integrated with the backend API
- Newsletter subscription form
- Contact information and social media links
- About section with company information

## Backend Integration

The frontend is configured to proxy API requests to the backend running on `http://localhost:8000`. Make sure your FastAPI backend is running before testing the lead form.

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

