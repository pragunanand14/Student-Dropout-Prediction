# Student Support Consultant

This folder documents the separate student-facing AI support chatbot feature added to the project.

## Related implementation files

- `backend/support_chatbot.py`: Gemini integration, safety checks, mood tags, and response generation.
- `backend/app.py`: `/api/support-chat` endpoint.
- `frontend/src/pages/SupportChatbot.jsx`: dedicated support chatbot page and UI.

## Environment variables

Add these values to the project root `.env` file:

```env
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

## Notes

- This chatbot is intentionally separate from the dropout prediction model and the admin dashboard chatbot.
- Severe-distress language is handled with a direct supportive escalation instead of a normal conversational reply.
