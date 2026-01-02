import { createSmartAccount } from "@/lib/aaActions";
import Button from "@/ui/Button";

export function CreateWallet({
  onSuccess,
}: {
  onSuccess?: () => Promise<void>;
}) {
  const createWallet = async () => {
    const smartAccountDetails = await createSmartAccount();
  };

  return (
    <>
      <h1>Create Wallet Component</h1>
      <Button onClick={createWallet}>Create Wallet</Button>
    </>
  );
}
