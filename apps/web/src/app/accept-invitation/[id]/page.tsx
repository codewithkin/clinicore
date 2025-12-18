import AcceptInvitationClient from "./client";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function AcceptInvitationPage({ params }: Props) {
    const paramsResolved = await params;

    return <AcceptInvitationClient invitationId={paramsResolved.id} />;
}
