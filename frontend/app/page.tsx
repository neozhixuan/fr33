
import NextLink from "next/link";
import Button from "./ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5">
      <h1>fr33</h1>
      <p>Decentralised B2C payments infrastructure for freelancers</p>
      <NextLink href={'/register'}>
        <Button>
          Register
        </Button>
      </NextLink>
    </div>
  );
}
