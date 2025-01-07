interface EmailTemplateProps {
  data: any
}

export const VendorTeamInviteEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
				{data.userName} has invited you to join the team at {data.storeName}.
      </h1>
      <p>
				To join the team at {data.storeName}, please accept the invitation.
				Your login email: {data.vendor.email}
      </p>
			<p>
				<a href={`${data.host}/invite/accept?token=${data.token}`}>Accept Invitation</a>
			</p>
			<p>
				If you have any questions, feel free to reach out to us.

				Best regards,
				The Mercur Team
			</p>
			<p>
				mercur.js
			</p>
    </div>
  );
};
