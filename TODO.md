You are an expert full stack web developer.

1. What is the best way for me to protect my chatbot from internet bots that will want to abuse it? I use a google recaptcha v2 for my contact me form and it works great. Is there something similar that I can use to protect my chatbot use to real people? I would like the chatbot to only be available to real users, not bots.

2. If this is not currently implemented, I would like all of my chatbot backend APIs to be protected with a simple API token, something like Bearer secret_key so that only my personal website can ever interact with it.



1. I need you to add some backend logic that will limit the number of conversations with one single user. Let's cap the back and forth at 30 messages per session.

2. Implement session-level tracing/grouping for openai. I want each visitor of the website to be trackable on openai dashboard. I believe you need to generate a session ID. Every chatbot message sent to OpenAI includes: conversation: <session-id>

Once the number of back and forth conversations hit the limit of 30 messages, or if you don't really know how to 