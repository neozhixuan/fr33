import Button from "@/ui/Button";
import CentralContainer from "../../layout/CentralContainer";
import { RegistrationForm } from "./components";

export default function RegisterPage() {
    return (
        <CentralContainer>
            <p>Register</p>
            <Button href={'/'}>Back to home</Button>
            <RegistrationForm />
        </CentralContainer>
    )
}