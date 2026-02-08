# Conversation Feature instructions

I have upgraded the Vacancy Notice feature to include a real-time chat/conversation between Tenants and Managers.

## 1. Upgrade Database (Crucial)

I have created a new SQL file that creates the `vacancy_notice_messages` table.

1.  Open **`database/UPDATE_VACANCY_NOTICES_CHAT.sql`**.
2.  Copy the entire content.
3.  Run it in the **Supabase SQL Editor** (just like before).

## 2. Feature Changes

### Tenant Portal
-   Tenants now see a "Communication" card below their notice status.
-   They can see history and type new messages to the manager.

### Manager Portal
-   The "Process Vacancy Notice" dialog now includes a scrollable "Conversation History" box.
-   Managers can see tenant replies.
-   Using "Save Reply Only" puts the message into the chat without closing the dialog.
-   Updating status (e.g., "Schedule Inspection") also saves the typed message into the chat history.

## Important Note
If you see "Could not fetch messages" or errors in the console, it is 100% because **Step 1 (Run SQL)** was not completed. Use the `UPDATE_VACANCY_NOTICES_CHAT.sql` file.
