import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import ABI from '../lib/ABI.json';

// Custom hook for viewing escrow balances
// Allows viewing balances for connected wallet or any specified address
export function useEscrowView(contractAddress) {
  const { address } = useAccount();
  const [viewAddress, setViewAddress] = useState('');

  // Read escrow data from contract
  // Uses wagmi's useReadContract hook to fetch balances
  const { data: escrowData, refetch: refetchEscrow, isLoading } = useReadContract({
    address: contractAddress,
    abi: ABI,
    functionName: 'viewEscrow',
    args: [viewAddress || address],
    query: {
      enabled: (!!viewAddress || !!address) && !!contractAddress,
    }
  });

  // Check if there are any balances
  const hasBalances = escrowData && escrowData[0]?.length > 0;

  return {
    viewAddress,
    setViewAddress,
    escrowData,
    refetchEscrow,
    isLoading,
    hasBalances
  };
}

