// arweaveUtils.js
const AOModule = "Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM"; // aos 2.0.1
const AOScheduler = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA";
const CommonTags = [
  { name: "Name", value: "Anon" },
  { name: "Version", value: "0.2.1" },
];

import {
  message,
  createDataItemSigner,
  dryrun
} from "@permaweb/aoconnect"

// connect wallet
export async function connectWallet() {
  try {
    if (!window.arweaveWallet) {
      alert('No Arconnect detected');
      return;
    }
    await window.arweaveWallet.connect(
      ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'ACCESS_TOKENS'],
      {
        name: 'Anon',
        logo: 'https://arweave.net/jAvd7Z1CBd8gVF2D6ESj7SMCCUYxDX_z3vpp5aHdaYk',
      },
      {
        host: 'g8way.io',
        port: 443,
        protocol: 'https',
      }
    );

    
  } catch (error) {
    console.error(error);
  } finally {
    console.log('connection finished execution');
  }
};

// disconnect wallet
export async function disconnectWallet() {
  return await window.arweaveWallet.disconnect();
};

// get wallet details
export async function getWalletAddress() {
  const walletAddress = await window.arweaveWallet.getActiveAddress();
  console.log(walletAddress)
  return walletAddress ;
};

// send message to process 
export const messageAR = async ({ tags = [], data, anchor = ''}) => {

  try {
  
    if (!pId) throw new Error("Process ID is required.");
    if (!data) throw new Error("Data is required.");

    console.log(pId)
    const allTags = [...CommonTags, ...tags];
    const messageId = await message({
      data:JSON.stringify(data),
      anchor,
      process:pId,
      tags: allTags,
      signer: createDataItemSigner(globalThis.arweaveWallet)
    });
    return messageId;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};


// fetch data from the processId
 export async function dryrunResult(processId, tags) {

 const res = await dryrun({
   process: pId,
   tags,
 }).then((res) => JSON.parse(res.Messages[0].Data))
 return res
}
