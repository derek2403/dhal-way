import { useWriteContract } from 'wagmi';
import ABI from '../lib/ABI.json';

// Custom hook for withdrawing from escrow
// Handles withdrawal transaction and callbacks
export function useEscrowWithdraw(contractAddress, onSuccess) {
  const { writeContract, isPending: isTransactionLoading } = useWriteContract({
    mutation: {
      onSuccess: (data, variables) => {
        if (variables.functionName === 'withdraw') {
          alert('Withdrawal successful!');
        }
        onSuccess?.();
      },
      onError: (error) => {
        alert('Transaction failed: ' + error.message);
      },
    },
  });

  // Execute withdrawal function on the smart contract
  const handleWithdraw = () => {
    writeContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'withdraw',
    });
  };

  return {
    handleWithdraw,
    isTransactionLoading
  };
}

