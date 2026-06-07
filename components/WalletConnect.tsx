'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useReadContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatUnits, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { monadTestnet } from '@/app/providers';
import { Wallet, LogOut, CheckCircle, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

const USDC_ADDRESS = '0x534b2f3A21130d7a60830c2Df862319e593943A3' as `0x${string}`;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  }
] as const;

// Virtual demo wallet storage helper
const getOrCreateVirtualWallet = () => {
  if (typeof window === 'undefined') return null;
  let key = localStorage.getItem('__translation_demo_key');
  if (!key) {
    // Generate a new random private key
    const rawKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    key = `0x${rawKey}`;
    localStorage.setItem('__translation_demo_key', key);
  }
  try {
    return privateKeyToAccount(key as `0x${string}`);
  } catch (err) {
    localStorage.removeItem('__translation_demo_key');
    return null;
  }
};

interface WalletConnectProps {
  useVirtual: boolean;
  setUseVirtual: (val: boolean) => void;
  virtualAddress: string;
  setVirtualAddress: (val: string) => void;
}

export function WalletConnect({
  useVirtual,
  setUseVirtual,
  virtualAddress,
  setVirtualAddress
}: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Real Wallet Balances
  const { data: monBalance } = useBalance({
    address,
  });

  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Local state for virtual wallet balances
  const [virtualMonBalance, setVirtualMonBalance] = useState('10.00');
  const [virtualUsdcBalance, setVirtualUsdcBalance] = useState('100.00');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const virtualAcc = getOrCreateVirtualWallet();
    if (virtualAcc) {
      setVirtualAddress(virtualAcc.address);
    }
  }, [setVirtualAddress]);

  const toggleWalletMode = () => {
    setUseVirtual(!useVirtual);
  };

  const usdcDecimals = 6;
  const realUsdcBalance = usdcBalanceRaw 
    ? parseFloat(formatUnits(usdcBalanceRaw, usdcDecimals)).toFixed(2) 
    : '0.00';

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full p-4 rounded-xl border border-purple-500/10 glass-card">
      <div className="flex justify-between items-center border-b border-purple-500/10 pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-400" />
          <span className="font-semibold text-purple-200">Wallet Connection</span>
        </div>
        
        {/* Toggle Mode */}
        <button
          onClick={toggleWalletMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
        >
          <Cpu className="h-3.5 w-3.5" />
          {useVirtual ? "Switch to MetaMask" : "Switch to Virtual Wallet"}
        </button>
      </div>

      {useVirtual ? (
        // Virtual Wallet Mode
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xs">
            <Cpu className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>
              <strong>Virtual Demo Wallet Active:</strong> Signs EIP-3009 authorizations cryptographically client-side. Zero setup required for judging.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Address */}
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] text-muted tracking-wider uppercase">Virtual Wallet Address</span>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-black/40 border border-purple-900/30 text-sm">
                <span className="font-mono text-purple-300">{shortenAddress(virtualAddress)}</span>
                <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/40 text-indigo-200 px-1.5 py-0.5 rounded-full font-bold">VIRTUAL</span>
              </div>
            </div>

            {/* MON Balance */}
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-950/20 border border-purple-900/20">
              <span className="text-[10px] text-muted tracking-wider uppercase">MON Balance</span>
              <span className="text-xl font-bold text-purple-200">{virtualMonBalance} <span className="text-xs text-purple-400">MON</span></span>
            </div>

            {/* USDC Balance */}
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-950/20 border border-purple-900/20">
              <span className="text-[10px] text-muted tracking-wider uppercase">USDC Balance</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-purple-200">{virtualUsdcBalance} <span className="text-xs text-purple-400">USDC</span></span>
                {/* Simulated faucet button */}
                <button
                  onClick={() => setVirtualUsdcBalance((parseFloat(virtualUsdcBalance) + 50).toFixed(2))}
                  className="text-[9px] font-bold bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 px-1.5 py-0.5 rounded transition cursor-pointer"
                >
                  +50 Faucet
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Live Wallet Mode
        <div className="flex flex-col gap-3">
          {isConnected && address ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Address */}
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-[10px] text-muted tracking-wider uppercase">USDC Payer Address</span>
                  <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-black/40 border border-purple-900/30 text-sm">
                    <span className="font-mono text-purple-300">{shortenAddress(address)}</span>
                    <span className="text-[10px] bg-green-500/20 border border-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      <CheckCircle className="h-2.5 w-2.5" /> LIVE
                    </span>
                  </div>
                </div>

                {/* MON Balance */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-950/20 border border-purple-900/20">
                  <span className="text-[10px] text-muted tracking-wider uppercase">MON Balance</span>
                  <span className="text-xl font-bold text-purple-200">
                    {monBalance ? parseFloat(formatUnits(monBalance.value, monBalance.decimals)).toFixed(4) : '0.000'} <span className="text-xs text-purple-400">MON</span>
                  </span>
                </div>

                {/* USDC Balance */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-950/20 border border-purple-900/20">
                  <span className="text-[10px] text-muted tracking-wider uppercase">USDC Balance</span>
                  <span className="text-xl font-bold text-purple-200">
                    {realUsdcBalance} <span className="text-xs text-purple-400">USDC</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => disconnect()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-300 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Connect an EVM wallet (MetaMask / Rabby) configured for the Monad Testnet (Chain ID 10143) to run live transactions.
                </span>
              </div>
              
              <button
                onClick={() => connect({ connector: injected() })}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                Connect Metamask / Rabby
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
