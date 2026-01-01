import NextLink from "next/link";
import Button from "../ui/Button";
import CentralContainer from "@/layout/CentralContainer";

export default function Home() {
  return (
    <CentralContainer>
      <h1>fr33</h1>
      <p>Decentralised B2C payments infrastructure for freelancers</p>
      <NextLink href={"/login"}>
        <Button>Login</Button>
      </NextLink>
      <NextLink href={"/job-portal"}>
        <Button>Enter the portal</Button>
      </NextLink>
    </CentralContainer>
  );
}
