import { NextRequest, NextResponse } from 'next/server';
import { verifyTypedData } from 'viem';
import { globalStore } from '@/lib/state';

// USDC EIP-3009 types
const RECEIVE_AUTHORIZATION_TYPES = {
  ReceiveWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authorization, signature, salt } = body;

    if (!authorization || !signature) {
      return NextResponse.json({ error: 'Authorization data and signature are required' }, { status: 400 });
    }

    const { from, to, value, validAfter, validBefore, nonce } = authorization;

    // USDC Domain parameters on Monad Testnet
    const domain = {
      name: 'USDC',
      version: '2',
      chainId: 10143,
      verifyingContract: '0x534b2f3A21130d7a60830c2Df862319e593943A3' as `0x${string}`
    } as const;

    const message = {
      from: from as `0x${string}`,
      to: to as `0x${string}`,
      value: BigInt(value),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce: nonce as `0x${string}`
    } as const;

    // Perform cryptographic verification of the EIP-712 EIP-3009 signature
    const isValid = await verifyTypedData({
      address: from as `0x${string}`,
      domain,
      types: RECEIVE_AUTHORIZATION_TYPES,
      primaryType: 'ReceiveWithAuthorization',
      message,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Default verify status (we mark as verified, pending translation quality checks)
    const verificationRecord = {
      passed: true,
      score: 1.0,
      reason: 'Cryptographic signature verified. Authorized to execute EIP-3009 transfer.',
      timestamp: Date.now()
    };

    // Store payment verification record linked to this unique signature nonce
    globalStore.setVerification(nonce, verificationRecord);

    return NextResponse.json({
      verified: true,
      nonce,
      reason: verificationRecord.reason
    });

  } catch (error: any) {
    console.error('API Verify Payment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
