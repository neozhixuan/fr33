import { auth, signOut } from "../../lib/auth";
import CentralContainer from "../../layout/CentralContainer";
import Button from "@/ui/Button";
import { redirect } from "next/navigation";

export default async function JobPortal() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return (
        <CentralContainer>
            <p>Job portal</p>
            <Button href={'/'}>Back to home</Button>
            <form action={logoutAction}>
                <Button type="submit">Logout</Button>
            </form>
        </CentralContainer>
    )
}

async function logoutAction() {
    'use server'

    await signOut();
    redirect('/');
}