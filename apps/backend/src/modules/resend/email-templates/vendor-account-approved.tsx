interface EmailTemplateProps {
  data: any
}

export const VendorAccountApprovedEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        Hello, {data.userName} 👋
        <br />
        Your account have been approved!
      </h1>
      <p>
        We’re happy to let you know that your application has been approved! This means your account is now activated on
        the Mercur marketplace.
      </p>
      <p>Thank you for choosing us. We are excited about your success and will support you every step of the way.</p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
