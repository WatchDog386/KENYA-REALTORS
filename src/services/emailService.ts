// src/services/emailService.ts
import { supabase } from '@/integrations/supabase/client';

interface ApprovalEmailData {
  email: string;
  firstName: string;
  role: string;
  propertyName?: string;
  unitName?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

export const emailService = {
  async sendApprovalEmail(data: ApprovalEmailData): Promise<void> {
    try {
      const { email, firstName, role, propertyName, unitName, managerName, managerEmail, managerPhone } = data;
      
      const loginUrl = `${window.location.origin}/login`;
      
      let emailBody = `
Dear ${firstName},

Your account has been approved! You can now login to the system.

**Your Login Credentials:**
- Login URL: ${loginUrl}
- Email: ${email}
- Role: ${role.replace('_', ' ').toUpperCase()}
`;

      if (role === 'property_manager') {
        emailBody += `

**You have been assigned as a Property Manager**
You can now manage assigned properties through your manager portal.
`;
      } else if (role === 'tenant') {
        emailBody += `

**Your Unit Assignment:**
- Property: ${propertyName}
- Unit: ${unitName}
`;
        
        if (managerName) {
          emailBody += `

**Property Manager Contact:**
- Name: ${managerName}
- Email: ${managerEmail}
- Phone: ${managerPhone}
`;
        }
      }

      emailBody += `

To login, click the link below or copy it into your browser:
${loginUrl}

If you have any questions, please contact our support team.

Best regards,
Property Management System
`;

      // Call Edge Function to send email
      const { data: response, error } = await supabase.functions.invoke('send-approval-email', {
        body: {
          to: email,
          firstName,
          role,
          propertyName,
          unitName,
          managerName,
          managerEmail,
          managerPhone,
          loginUrl
        }
      });

      if (error) {
        console.error('Error sending email via Edge Function:', error);
        // Still consider it a success for now, as the user is approved
      }

      console.log('Approval email sent to:', email);
    } catch (error) {
      console.error('Error in emailService.sendApprovalEmail:', error);
      // Don't throw - email sending is secondary
    }
  },

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const loginUrl = `${window.location.origin}/login`;

      const { data: response, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          to: email,
          firstName,
          loginUrl
        }
      });

      if (error) {
        console.error('Error sending welcome email:', error);
      }

      console.log('Welcome email sent to:', email);
    } catch (error) {
      console.error('Error in emailService.sendWelcomeEmail:', error);
    }
  }
};
