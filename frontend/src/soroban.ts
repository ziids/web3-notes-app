import {
  Contract,
  scValToNative,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

export const CONTRACT_ID = 'CDHZOCLC7IK25AW2OTP7BT7ZT6F3TJ5BH5O4IVP7WFTVGWEYOD4VUCWD';
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export interface Note {
  id: bigint | number;
  title: string;
  content: string;
}

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

// Read call: get_notes
export async function getNotes(): Promise<Note[]> {
  try {
    const tx = new TransactionBuilder(
      // Dummy account for read-only simulation
      await server.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'),
      {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call('get_notes'))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result)) {
      const retval = result.result?.retval;
      if (retval) {
        const native = scValToNative(retval);
        return (native || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
        }));
      }
    }
    return [];
  } catch (err) {
    console.error('Error fetching notes:', err);
    return [];
  }
}

// Write call: create_note
export async function createNote(userPublicKey: string, title: string, content: string): Promise<string> {
  const account = await server.getAccount(userPublicKey);

  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'create_note',
        nativeToScVal(title, { type: 'string' }),
        nativeToScVal(content, { type: 'string' })
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signResult = await signTransaction(
    preparedTx.toXDR(),
    {
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  );

  if (signResult.error || !signResult.signedTxXdr) {
    const errorMsg = typeof signResult.error === 'object'
      ? JSON.stringify(signResult.error)
      : signResult.error;
    throw new Error(errorMsg || 'Failed to sign transaction');
  }

  const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE);
  const sendResp = await server.sendTransaction(signedTx);

  if (sendResp.status === 'PENDING') {
    let getResp = await server.getTransaction(sendResp.hash);
    while (getResp.status === 'NOT_FOUND') {
      await new Promise((r) => setTimeout(r, 1000));
      getResp = await server.getTransaction(sendResp.hash);
    }
    if (getResp.status === 'SUCCESS') {
      return 'SUCCESS';
    }
    return getResp.status;
  }
  return sendResp.status;
}

// Write call: delete_note
export async function deleteNote(userPublicKey: string, id: number | bigint): Promise<string> {
  const account = await server.getAccount(userPublicKey);

  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('delete_note', nativeToScVal(BigInt(id), { type: 'u64' }))
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signResult = await signTransaction(
    preparedTx.toXDR(),
    {
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  );

  if (signResult.error || !signResult.signedTxXdr) {
    const errorMsg = typeof signResult.error === 'object'
      ? JSON.stringify(signResult.error)
      : signResult.error;
    throw new Error(errorMsg || 'Failed to sign transaction');
  }

  const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE);
  const sendResp = await server.sendTransaction(signedTx);

  if (sendResp.status === 'PENDING') {
    let getResp = await server.getTransaction(sendResp.hash);
    while (getResp.status === 'NOT_FOUND') {
      await new Promise((r) => setTimeout(r, 1000));
      getResp = await server.getTransaction(sendResp.hash);
    }
    if (getResp.status === 'SUCCESS') {
      return 'SUCCESS';
    }
    return getResp.status;
  }
  return sendResp.status;
}
