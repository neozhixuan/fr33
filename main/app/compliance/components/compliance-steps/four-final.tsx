import { useEffect, useState } from "react";
import { getWalletAddress } from "@/lib/aaActions";
import Button from "@/ui/Button";

export function FinalCheckpoint({
  userId,
  onSuccess,
}: {
  userId: number;
  onSuccess: () => void;
}) {
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const fetchWalletAddress = async () => {
      const walletAddress = await getWalletAddress(userId);
      setWalletAddress(walletAddress);
    };
    fetchWalletAddress();
  }, [userId]);

  return (
    <>
      <h1>Congratulations, you have completed the compliance sequence.</h1>
      <p>Your walletAddress is {walletAddress}.</p>
      <Button onClick={onSuccess}>Proceed to Dashboard</Button>
    </>
  );
}
